const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

const secretKey = process.env.JWT_SECRET

router.post('/login', async (req, res) => { 
    try {
        const { email, password } = req.body;
        const user = await prisma.users_test.findUnique({
            where: { email }
        })

        if(!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: '信箱或密碼錯誤' })
        }
        
        const payLoad = {
          email: user.email,
          password: user.password
        };

        const token = jwt.sign(payLoad, secretKey, { expiresIn: '1h' });
    
        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ msg: "伺服器錯誤" });
}
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if(!token) {
        return res.status(401).json({ message: '沒有 token' })
    }

    jwt.verify(token, secretKey, (err, user) => {
        if(err) {
            return res.status(403).json({ message: 'token 無效' })
        }

        req.user = user
        next()
    })
}

router.get('/profile', authenticateToken, (req, res) => {
    res.json({ user: req.user })
})

module.exports = router;