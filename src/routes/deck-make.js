const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

// 連接資料庫
const prisma = new PrismaClient();

// 創建牌組
router.post("/add-deck", async (req, res) => {
  try {
    const { userToken, deckData } = req.body;
    const userData = jwt.decode(userToken);
    const deckId = await checkDeckId();
    const addDeckData = await prisma.deck_list.create({
      data: {
        deck_id: deckId,
        user_email: userData.email,
        deck_name: deckData.deckName,
        deck: JSON.stringify(deckData.deck),
        deck_cover: deckData.deckCover,
        deck_description: deckData.deckDescription,
      },
    });

    if (addDeckData) {
      res.status(200).json({ message: "已存入資料庫" });
    } else {
      res.status(400).json({ message: "存入失敗，請再試一次" });
    }
  } catch (error) {
    res.status(500).json({ message: "伺服器錯誤" });
  }
});

// 生成唯一id
async function checkDeckId() {
  let deckId = uuidv4().slice(0, 5);
  const deckIdCheck = await prisma.deck_list.findUnique({
    where: {
      deck_id: deckId,
    },
  });
  if (deckIdCheck) {
    await checkDeckId();
  } else {
    return deckId;
  }
}

module.exports = router;
