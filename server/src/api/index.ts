import express from "express";

import type MessageResponse from "../interfaces/message-response.js";

import emojis from "./emojis.js";
import algorand from "./algorand.js";

const router = express.Router();

router.get<object, MessageResponse>("/", (req, res) => {
  res.json({
    message: "API - 👋🌎🌍🌏",
  });
});

router.use("/emojis", emojis);
router.use("/algorand", algorand);

export default router;
