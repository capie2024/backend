const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// API：獲取 Deck 清單
router.get("/deck-list", async (req, res) => {
  try {
    const decks = await prisma.deckList.findMany();
    res.json(decks);
  } catch (error) {
    console.error("錯誤：", error);
    res.status(500).send("伺服器錯誤");
  }
});

module.exports = router;
