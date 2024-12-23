const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

router.get('/search', async (req, res) => {
  const { deckId, post_code } = req.query;

  try {
    if (deckId) {
      // 查詢牌組代碼
      const deck = await prisma.deck_list.findUnique({
        where: { deck_id: deckId },
      });

      if (deck) {
        return res.json({
          success: true,
          data: { deck_id: deck.deck_id },
        });
      } else {
        return res.status(404).json({ error: "未找到對應的牌組！" });
      }
    } else if (post_code) {
      // 查詢社群文章代碼
      const article = await prisma.add_article.findUnique({
        where: { post_code: post_code },
      });

      if (article) {
        return res.json({
          success: true,
          data: { post_code: article.post_code },
        });
      } else {
        return res.status(404).json({ error: "未找到對應的文章！" });
      }
    } else {
      return res.status(400).json({ error: "請提供 牌組ID 或 文章ID！" });
    }
  } catch (error) {
    res.status(500).json({ error: "伺服器錯誤，請稍後再試！" });
  }
});


module.exports = router;
