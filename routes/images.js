import express from "express";
import { addImage, getImages } from "../controllers/images.js";

const router = express.Router();

router.get("/", getImages);
router.post("/", addImage);

export default router;
