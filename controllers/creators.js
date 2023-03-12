import { GraphQLClient, request, gql } from "graphql-request";
import { graphqlAPI, GRAPHCMS_TOKEN } from "../config.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { TOKEN_KEY } from "../config.js";

const graphQLClient = new GraphQLClient(graphqlAPI, {
  headers: {
    authorization: `Bearer ${process.env.GRAPHCMS_TOKEN}`,
  },
});

const publish = gql`
  mutation MyMutation($id: ID) {
    publishCreator(where: { id: $id }, to: PUBLISHED) {
      id
    }
  }
`;

export const getCreator = async (req, res) => {
  console.log(req.query);
  try {
    const query = gql`
      query MyQuery($email: String!) {
        creatorsConnection(where: { email: $email }) {
          edges {
            node {
              email
              id
              name
              password
              slug
              images {
                id
                url
                views
                prompt
                likes
              }
            }
          }
        }
      }
    `;

    const result = await request(graphqlAPI, query, req.query);

    res.status(200).json(result.creatorsConnection.edges);
  } catch (error) {
    console.log(error.message);
  }
};

export const addCreator = async (req, res) => {
  const encryptedPass = req.body.slug && (await bcrypt.hash(req.body.slug, 10));
  req.body.password = encryptedPass;

  console.log(req.body);
  const query = gql`
    mutation CreateCreator(
      $name: String!
      $email: String!
      $password: String!
      $slug: String!
    ) {
      createCreator(
        data: { name: $name, email: $email, slug: $slug, password: $password }
      ) {
        id
      }
    }
  `;
  try {
    const result = await graphQLClient.request(query, req.body);

    res.status(200).json({ message: "success" });

    const published = await graphQLClient.request(publish, {
      id: result.createCreator.id,
    });
    console.log("published", published);
  } catch (error) {
    console.log(error.message);
    res.json({ message: error.response.errors[0].message });
  }
};

export const loginCreator = async (req, res) => {
  console.log(req.body);
  try {
    const query = gql`
      query MyQuery($userName: String!) {
        creator(where: { userName: $userName }) {
          name
          slug
          email
          password
        }
      }
    `;

    const result = await request(graphqlAPI, query, req.body);
    const validPass =
      result.creator &&
      (await bcrypt.compare(req.body.password, result.creator.password));
    result.creator && delete result.creator.password;

    console.log(validPass);

    const token = jwt.sign({ user_id: result.creator.slug }, TOKEN_KEY);

    result.creator.token = token;

    res.status(200).json(validPass ? result : false);
  } catch (error) {
    console.log(error.message);
  }
};
