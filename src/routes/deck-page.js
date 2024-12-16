const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router(); // 定義 router
const prisma = new PrismaClient();

// 查詢指定 deck_id 的資料
router.get('/deck-page/:deck_id', async (req, res) => {
  const { deck_id } = req.params; // 從 URL 中獲取 deck_id
  try {
    // 查詢 deck_list 表，根據 deck_id 查詢資料
    const deck = await prisma.deck_list.findUnique({
      where: {
        deck_id: deck_id, // 使用 deck_id 來查詢對應的資料
      },
      select: {
        deck_id: true,
        deck_name: true,
        deck: true,
        deck_cover: true,
        deck_description: true,
        build_time: true,
        users: {
          select: {
            username: true, // 查詢對應的用戶名
          },
        },
      },
    });

    if (deck) {
      res.status(200).json(deck); // 回傳查詢到的 deck 資料
    } else {
      res.status(404).json({ error: '找不到對應的資料' }); // 若沒有找到資料，返回 404
    }
  } catch (error) {
    console.error('資料庫查詢失敗:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  } finally {
    await prisma.$disconnect();
  }
});

module.exports = router; // 確保 export 了 router
