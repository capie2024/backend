const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const verifyToken = require('../middlewares/verifyToken'); // 驗證中間件

router.get('/notices', verifyToken, async (req, res) => {
    try {
        const {userId} = req.user; // 從中間件解析出的使用者 ID

        // 查詢用戶自己的文章
        const userArticles = await prisma.add_article.findMany({
            where: { user_id: userId },
            select: {
                id: true, // 必須加入文章 ID
                post_code: true, // 文章代碼
                title: true, // 文章標題
            },
        });

        // 提取用戶文章的 IDs
        const articleIds = userArticles.map((article) => article.id);

        // 查詢與文章相關的留言
        const comments = await prisma.comment_test.findMany({
            where: {
                article_id: { in: articleIds }, 
            },
            select: {
                id: true,
                created_at: true, 
                user_id: true, 
                article_id: true, 
            },
            orderBy: {
                created_at: 'desc', 
            },
        });

        const formattedNotices = [];
        for (const comment of comments) {
            const article = userArticles.find((a) => a.id === comment.article_id);
            if (article) {
                // 檢查是否已存在於 notice_test
                const existingNotice = await prisma.notice_test.findFirst({
                    where: {
                        article_id: comment.article_id,
                        comment_id: comment.id, // 確認使用正確的 comment.id
                        user_id: userId,
                    },
                });
                let notice;

                // 如果不存在，創建新通知
                if (!existingNotice) {
                    notice = await prisma.notice_test.create({
                        data: {
                            is_read: false,
                            article_id: comment.article_id, // 傳遞 article_id
                            comment_id: comment.id,        // 傳遞 comment_id
                            user_id: userId,               // 傳遞 user_id
                        },
                    });
                } else {
                    // 如果已存在，直接使用 existingNotice
                    notice = existingNotice;
                }
                
                // 加入到通知陣列
                formattedNotices.push({
                    id: notice.id, // 使用 notice_test 的 id
                    created_at: comment.created_at,
                    user_id: comment.user_id,
                    post_code: article.post_code,
                    title: article.title,
                    is_read: notice.is_read,
                });
            }
        }
        // 計算未讀留言數量
        const unreadCount = await prisma.notice_test.count({
            where: {
                article_id: { in: articleIds }, 
                is_read: false, 
            },
        });

        // 返回結果
        res.json({
            unreadCount,
            notices: formattedNotices,
        });
    } catch (err) {
        console.error('Error fetching notices:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

router.post('/mark-as-read', verifyToken, async (req, res) => {
    try {
        const { noticeId } = req.body; 

        if (!noticeId) {
            return res.status(400).json({ error: 'Notice ID is required' });
        }

        const updatedNotice = await prisma.notice_test.update({
            where: { id: noticeId },
            data: { is_read: true },
        });

        console.log('Updated Notice:', updatedNotice);

        // 判斷更新結果
        if (updatedNotice.is_read === true) {
            return res.status(200).json({
                message: 'Notification marked as read',
                is_read: true,
                noticeId: updatedNotice.id,
            });
        } else {
            return res.status(500).json({ error: 'Failed to mark as read' });
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;
