const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const verifyToken = require('../middlewares/verityToken');

const prisma = new PrismaClient();

router.put('/users/update-name', verifyToken, async (req, res) => {
    try {
        await prisma.users.update({
            where: {
              id: req.user.userId
            },
            data: {
              username: req.body.name
            }
        })

        res.status(200).json({ message: '更新成功', data: { name: req.body.name } });
    } catch (error) {
        res.status(400).json({ message: '更新失敗' });
    }
});

module.exports = router;