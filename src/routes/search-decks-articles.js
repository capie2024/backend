const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

router.post('/search', async (req, res) => {
  // const { post_code, deckId ,type} = req.body;
  // if(!deckId && !post_code){
  //   return res.status(400).json({ error:"請提供正確ID" })
  // }

  try {
    if (type === 'deck') {
      // 查詢牌組代碼
      const deck = await prisma.deck_list.findUnique({
        where: { deck_id: deckId },
      });

      if (deck) {
        return res.json({ deck_id: deck.deck_id });
      } else {
        return res.status(404).json({ message: '未找到對應的牌組！' });
      }
    } else if (type === 'community') {
      // 查詢社群文章代碼
      const article = await prisma.add_article.findUnique({
        where: { post_code: post_code },
      });

      if (article) {
        return res.json({ post_code: article.post_code });
      } else {
        return res.status(404).json({ message: '未找到對應的社群文章！' });
      }
    } else {
      return res.status(400).json({ message: '無效的類型！' });
    }
  } catch (error) {
    console.error('伺服器錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤，請稍後再試！' });
  }
});

module.exports = router;
