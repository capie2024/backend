const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const verifyToken = require('../middlewares/verifyToken');

const prisma = new PrismaClient();

router.get('/decks', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId; // 解析token取得userId

    const decks = await prisma.deck_list.findMany({
        where: { user_id: userId },
      });

    res.json({ decks });
  } catch (error) {
    console.error('獲取牌組失敗', error);
    res.status(500).json({ message: '獲取牌組失敗' });
  }
});

module.exports = router;