const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/deck/:post_code', async (req, res) => {
    const { post_code } = req.params;
    try {
        const deck = await prisma.add_article.findMany({
            where: {
                post_code: post_code // 篩選指定的 post_code
            },
            include: {
                deck_list: { // 關聯查詢
                    select: {
                        deck_name: true,
                        deck: true,
                        deck_cover: true
                    }
                }
            }
        });
        res.json(deck);
        console.log('Fetched specific deck:', deck);
    } catch (error) {
        console.error('Error fetching deck:', error);
        res.status(500).json({ error: 'Failed to fetch deck' });
    }
});

module.exports = router