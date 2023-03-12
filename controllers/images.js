import { GraphQLClient, request, gql } from "graphql-request";
import { graphqlAPI, GRAPHCMS_TOKEN } from "../config.js";

const graphQLClient = new GraphQLClient(graphqlAPI, {
  headers: {
    authorization: `Bearer ${process.env.GRAPHCMS_TOKEN}`,
  },
});


const publish = gql`
  mutation MyMutation($id: ID) {
    publishImage(where: { id: $id }, to: PUBLISHED) {
      id
    }
  }
`;

export const getImages = async (req, res) => {
  try {
    const query = gql`
      query MyQuery {
        imagesConnection(first: 15, orderBy: publishedAt_DESC) {
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          edges {
            node {
              likes
              id
              prompt
              url
              views
              creator {
                ... on Creator {
                  id
                  name
                  slug
                }
              }
            }
          }
        }
      }
    `;

    const result = await request(graphqlAPI, query);

    res.status(200).json(result.imagesConnection);
  } catch (error) {
    console.log(error.message);
  }
};

export const getImagesPage = async (req, res) => {
  console.log(req.body);
  const direction = req.body.direction;
  try {
    const query = gql`
      query MyQuery($cursor: String) {
        imagesConnection(orderBy: publishedAt_DESC, after: $cursor) {
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          edges {
            cursor
            node {
              likes
              id
              prompt
              url
              views
              creator {
                ... on Creator {
                  id
                  name
                  slug
                }
              }
            }
          }
        }
      }
    `;

    const result = await request(graphqlAPI, query, req.body);

    res.status(200).json(result.imagesConnection);
  } catch (error) {
    console.log(error.message);
  }
};

export const addImage = async (req, res) => {
  console.log(req.body);
  const query = gql`
    mutation CreateImage(
      $prompt: String!
      $url: String!
      $likes: Int
      $views: Int
      $creator_id: ID
    ) {
      createImage(
        data: {
          prompt: $prompt
          url: $url
          likes: $likes
          views: $views
          creator: { connect: { Creator: { id: $creator_id } } }
        }
      ) {
        id
      }
    }
  `;
  try {
    const result = await graphQLClient.request(query, req.body);

    res.status(200).json({ message: "success" });

    const published = await graphQLClient.request(publish, {
      id: result.createImage.id,
    });
    console.log("published", published);
  } catch (error) {
    console.log(error.message);
    res.json({ message: error.response.errors[0].message });
  }
};
