const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const verifyToken  = require('../middlewares/verifyToken');

router.get('/currentUser', verifyToken, async (req, res) => {
        const { userId } = req.user;

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

        res.status(200).json(user);
});

router.get('/article-id/:post_code', async (req, res) => {
    const { post_code } = req.params;

    const article = await prisma.add_article.findUnique({
        where: { post_code },
        select: { 
            id: true,
            user_id: true,  
            title: true,
            content: true,
            created_at: true,
            post_picture: true,
            user_id: true, 
        },
    });

    if (article) {
        const user = await prisma.users.findUnique({
            where: { id: article.user_id },
            select: { picture: true }, 
        });

        if (user) {
            res.json({ 
                article_id: article.id, 
                user_id: article.user_id,
                title: article.title,
                content: article.content,
                created_at: article.created_at,
                post_picture: article.post_picture,
                user_picture: user.picture, 
            });
        } else {
            return res.status(404).json({ message: 'User not found' });
        }
    } else {
        return res.status(404).json({ message: 'Article not found' });
    }
});

router.get('/comments', async (req, res) => {
    const { articleId } = req.query;
    const userId = req.user?.userId; // 可選鏈接，未登入時 userId 為 undefined

    try {
        if (!articleId) {
            return res.status(400).json({ error: "articleId parameter is required" });
        }

        const messages = await prisma.comment_test.findMany({
            where: { article_id: parseInt(articleId, 10) },
            orderBy: { created_at: 'desc' },
            include: {
                users: true, // 用於返回留言者的資料
                comment_reactions: userId
                    ? { // 如果用戶登入，聯結該用戶的 reactions
                        where: { user_id: userId },
                        select: {
                            liked: true,
                            disliked: true,
                        },
                    }
                    : false, // 未登入時不聯結
            },
        });

        // 格式化返回數據
        const formattedMessages = messages.map(message => ({
            id: message.id,
            user_id: message.user_id,
            article_id: message.article_id,
            message: message.message,
            like_count: message.like_count, // 始終返回 like_count
            created_at: message.created_at,
            users: message.users,
            isLiked: userId ? message.comment_reactions[0]?.liked || false : null, // 登入才返回狀態
            isHated: userId ? message.comment_reactions[0]?.disliked || false : null, // 登入才返回狀態
        }));

        res.json(formattedMessages);
    } catch (error) {
        console.error("Error fetching comments:", error);
        return res.status(500).json({ error: error.message });
    }
});

router.post('/send-message', verifyToken, async (req, res) => {
    const { messageData } = req.body; 
    const { userId } = req.user;

    try {
        const comment = await prisma.comment_test.create({
            data: {
                comment_id: messageData.id,
                user_id: parseInt(userId),
                message: messageData.message, 
                like_count: messageData.like_count, 
                created_at: new Date().toISOString(),
                article_id: messageData.article_id, 
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

router.put('/comments/:id', async (req, res) => {
    const { id } = req.params;
    const { message } = req.body;
    
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

router.delete('/comments/:id', async (req, res) => {
    const { id } = req.params

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

router.post("/comments/:commentId/toggleLike", verifyToken, async (req, res) => {
    try{
        const { commentId } = req.params;
        const { userId } = req.user;

        let reaction = await prisma.comment_reactions.findFirst({
            where: {
                comment_id: Number(commentId),
                user_id: Number(userId),
            },
        });

        if (reaction) {
            const isLiked = !reaction.liked; 
            const likeAdjustment = isLiked ? 1 : -1; 
            await prisma.comment_reactions.update({
                where: { id: reaction.id },
                data: {
                    liked: isLiked,
                    disliked: false,
                },
            });

            await prisma.comment_test.update({
                where: { id: Number(commentId) },
                data: { like_count: { increment: likeAdjustment } },
            });

            const updatedComment = await prisma.comment_test.findUnique({
                where: { id: Number(commentId) },
            });

            return res.status(200).json({
                isLiked,
                isHated: false, 
                likeCount: updatedComment.like_count,
            });
        } else {
            await prisma.comment_reactions.create({
                data: {
                    comment_id: Number(commentId),
                    user_id: Number(userId),
                    liked: true,
                    disliked: false, 
                    created_at: new Date(),
                },
            });

            await prisma.comment_test.update({
                where: { id: Number(commentId) },
                data: { like_count: { increment: 1 } },
            });

            const updatedComment = await prisma.comment_test.findUnique({
                where: { id: Number(commentId) },
            });

            return res.status(200).json({
                isLiked: true,
                isHated: false, 
                likeCount: updatedComment.like_count,
            });
        }
    } catch (error) {
        console.error("Error toggling like:", error);
        return res.status(500).json({ message: "伺服器錯誤" });
    }
});

router.post("/comments/:commentId/toggleHate", verifyToken,async (req, res) => {
    try{
        const { commentId } = req.params;
        const { userId } = req.user;
    
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
                    liked: false, 
                },
            });
    
            if (reaction.liked) {
                await prisma.comment_test.update({
                    where: { id: Number(commentId) },
                    data: { like_count: { decrement: 1 } },
                });
            }
    
            const updatedComment = await prisma.comment_test.findUnique({
                where: { id: Number(commentId) },
            });

            return res.status(200).json({
                isHated,
                isLiked: reaction.liked, 
                likeCount: updatedComment.like_count, 
            });        
        } else {
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

router.get("/comments/:commentId/reactions", verifyToken, async (req, res) => {
    try {
        const { commentId } = req.params;
        const { userId } = req.user; 

        const reaction = await prisma.comment_reactions.findFirst({
            where: {
                comment_id: Number(commentId),
                user_id: Number(userId),
            },
        });

        const comment = await prisma.comment_test.findUnique({
            where: { id: Number(commentId) },
        });

        const responseData = {
            commentId: commentId,
            isLiked: reaction ? reaction.liked : false,
            isHated: reaction ? reaction.disliked : false,
            likeCount: comment ? comment.like_count : 0,
        };

        return res.status(200).json(responseData);
    } catch (error) {
        console.error('Error fetching comment reactions:', error);
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
    res.json(comments);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
