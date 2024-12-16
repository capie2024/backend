const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const verifyToken  = require('../middlewares/verifyToken');

// 獲取當前用戶資料
router.get('/currentUser', verifyToken, async (req, res) => {
    try {
        const { userId } = req.user;
        // 查詢用戶資料
        const user = await prisma.users.findUnique({
            where: { id: parseInt(userId)},
            select: {
                username: true,
                picture: true,
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const defaultPicture = 'https://bottleneko.app/icon.png';
        user.picture = user.picture || defaultPicture;

        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// 根據post_code查詢article_id
router.get('/article-id/:post_code', async (req, res) => {
    const { post_code } = req.params;

    try {
        // 根據 post_code 查詢對應的 article_id
        const article = await prisma.add_article.findUnique({
            where: { post_code: post_code },  // 根據 post_code 查詢
        });

        if (article) {
            res.json({ article_id: article.id });  // 返回對應的 article_id
        } else {
            return res.status(404).json({ message: 'Article not found' });
        }
    } catch (error) {
        console.error('Error fetching article_id from post_code:', error);
        return res.status(500).json({ error: error.message });
    }
});

// 新增留言
router.post('/send-message', verifyToken, async (req, res) => {
    const { newMessage} = req.body;
    const {userId} = req.user;

    try {
        const comment = await prisma.comment_test.create({
        data: {
            user_id: parseInt(userId),
            message: newMessage.message,
            like_count: newMessage.like_count,
            created_at: new Date().toISOString(),
            article_id: newMessage.article_id,
        },
        include: {
            users: { select: { username: true, picture: true } },
            add_article: { select: { post_code: true } },
        }
        });
        res.status(201).json(comment);
    } catch (error) {
        console.error('錯誤訊息:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// 編輯留言
router.put('/comments/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { message } = req.body;
    const userData = req.user;
    
    try {
        const updatedComment = await prisma.comment_test.update({
        where: { id: parseInt(id) },
        data: { 
            message,
            created_at: new Date(),},
        });
        res.json(updatedComment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

// 刪除留言
router.delete('/comments/:id', verifyToken, async (req, res) => {
    const { id } = req.params
    const userData = req.user

    try {
        const existingComment = await prisma.comment_test.findUnique({
            where: { id: parseInt(id) },
        })        
        if (!existingComment) {
            return res.status(404).json({ error: "Comment not found." });
        }
        const deletedComment = await prisma.comment_test.delete({
            where: { id: parseInt(id) },
        })        
        res.json({ success: true, message: "Comment deleted successfully.", deletedComment });
    } catch (error) {
        console.error("刪除失敗", error.message);
        res.status(500).json({ error: "Failed to delete the comment." });
    }
});

// 留言按讚
router.post("/comments/:commentId/toggleLike", verifyToken, async (req, res) => {
    try{
        const { commentId } = req.params;
        const { userId } = req.user;

        // 查詢是否已有 reaction
        let reaction = await prisma.comment_reactions.findFirst({
            where: {
                comment_id: Number(commentId),
                user_id: Number(userId),
            },
        });

        if (reaction) {
            const isLiked = !reaction.liked; // 切換讚的狀態
            const likeAdjustment = isLiked ? 1 : -1; // 根據新狀態調整 Like 數
            await prisma.comment_reactions.update({
                where: { id: reaction.id },
                data: {
                    liked: isLiked,
                    disliked: false, // 按讚時必須清除 Hate 狀態
                },
            });

            // 更新讚數
            await prisma.comment_test.update({
                where: { id: Number(commentId) },
                data: { like_count: { increment: likeAdjustment } },
            });

            // 查詢最新數據
            const updatedComment = await prisma.comment_test.findUnique({
                where: { id: Number(commentId) },
            });

            return res.status(200).json({
                isLiked,
                isHated: false, // 按讚後必須清除 Hate 狀態
                likeCount: updatedComment.like_count,
            });
        } else {
            // 尚無 reaction，新增一條記錄
            await prisma.comment_reactions.create({
                data: {
                    comment_id: Number(commentId),
                    user_id: Number(userId),
                    liked: true,
                    disliked: false, // 初始狀態為讚，無 Hate
                    created_at: new Date(),
                },
            });

            // 更新讚數
            await prisma.comment_test.update({
                where: { id: Number(commentId) },
                data: { like_count: { increment: 1 } },
            });

            const updatedComment = await prisma.comment_test.findUnique({
                where: { id: Number(commentId) },
            });

            return res.status(200).json({
                isLiked: true,
                isHated: false, // 新增時，Hate 狀態為 false
                likeCount: updatedComment.like_count,
            });
        }
    } catch (error) {
        console.error("Error toggling like:", error);
        return res.status(500).json({ message: "伺服器錯誤" });
    }
});

// 留言按倒讚
router.post("/comments/:commentId/toggleHate", verifyToken,async (req, res) => {
    try{
        const { commentId } = req.params;
        const { userId } = req.user;
    
        // 查詢是否已有 reaction
        let reaction = await prisma.comment_reactions.findFirst({
            where: {
                comment_id: Number(commentId),
                user_id: Number(userId),
            },
        });
    
        if (reaction) {
            const isHated = !reaction.disliked;
    
            await prisma.comment_reactions.update({
                where: { id: reaction.id },
                data: {
                    disliked: isHated,
                    liked: false, // 清除 Like 狀態
                },
            });
    
            if (reaction.liked) {
                // 如果之前有按讚，取消讚數
                await prisma.comment_test.update({
                    where: { id: Number(commentId) },
                    data: { like_count: { decrement: 1 } },
                });
            }
    
            return res.status(200).json({
                isHated,
                isLiked: false, // Hate 時必須強制取消 Like
            });
        } else {
            // 尚無 reaction，新增一條記錄
            await prisma.comment_reactions.create({
                data: {
                    comment_id: Number(commentId),
                    user_id: Number(userId),
                    liked: false,
                    disliked: true,
                    created_at: new Date(),
                },
            });
    
            return res.status(200).json({
                isHated: true,
            });
        }
    } catch (error) {
        console.error("Error toggling hate:", error);
        return res.status(500).json({ message: "伺服器錯誤" });
    }
});
        
//查詢所有留言
router.get('/comments', async (req, res) => {
    try {
        const comments = await prisma.comment_test.findMany({
        include: {
            users: { select: { username: true, picture: true } },
            add_article: { select: { post_code: true } },
        },
    });
    console.log('Comments:', comments);
    res.json(comments);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
