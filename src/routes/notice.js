const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const verifyToken = require('../middlewares/verifyToken');

router.get('/notices', verifyToken, async (req, res) => {
    const {userId} = req.user; // 假設 JWT 驗證已提供 user_id
    try {
        // 查詢未讀通知數量
        const unreadCount = await prisma.notice_test.count({
            where: {
                user_id: userId,
                is_read: false,
            },
        });

        // 查找相關通知 (例如有留言的文章)
        const newCommentNotice = await prisma.add_article.findMany({
            where: {
                user_id: userId,
            },
            include: {
                comment_test: {
                    select: {
                        created_at: true,
                        user_id: true,
                    },
                },
            },
        });

        // 返回整合的通知資料
        res.json({
            unreadCount, // 未讀通知數量
            notices: newCommentNotice, // 通知列表
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;

