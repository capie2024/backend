const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const verifyToken = require('../middlewares/verityToken');

const prisma = new PrismaClient();

router.get('/posts', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId; // 解析token取得userId
    const posts = await prisma.add_article.findMany({
        where: { user_id: userId },
      });
    res.json({ posts });
  } catch (error) {
    console.error('獲取文章失敗', error);
    res.status(500).json({ message: '獲取文章失敗' });
  }
});

module.exports = router;