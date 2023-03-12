import express from "express";
import { addCreator, getCreator, loginCreator } from "../controllers/creators.js";

const router = express.Router();

router.get("/", getCreator);
router.get("/login", loginCreator);
router.post("/", addCreator);

export default router;
