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


router.delete('/decks/:deck_id', verifyToken, async (req, res) => {
  try {
    const { deck_id } = req.params;

    const deletedDeck = await prisma.deck_list.delete({
        where: { deck_id },
    });

    res.json({ success: true, message: '刪除成功', deletedDeck });
  } catch (error) {
    if (error.code === 'P2003') {
      res.status(400).json({ message: '已引用於文章,無法刪除' });
    } else {
      console.error('删除牌组失败:', error);
      res.status(500).json({ message: '刪除失敗'});
    }
  }
});

module.exports = router;