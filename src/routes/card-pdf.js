const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// API：獲取 Deck 清單
router.get("/cardPDF", async (req, res) => {
  try {
    const decks = await prisma.deck_list.findMany();  // 查詢所有的 Deck 清單
    res.json(decks);
  } catch (error) {
    res.status(500).send("伺服器錯誤");
  }
});

module.exports = router;
