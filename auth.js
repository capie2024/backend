const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const { PrismaClient } = require('@prisma/client') // 資料庫
const prisma = new PrismaClient() // 建立 Prisma Client

const app = express();
app.use(express.json());
// app.use('/auth', authRouter)

dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY;

const users = [
    {
        id: 1,
        username: "user1",
        email: "user1@example.com",
        password: "password1"
        
    },
    {
        id: 2,
        username: "user2",
        email: "user2@example.com",
        password: "password2",
    },
];

// 註冊
app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body
        const hashedPassword = await bcrypt.hash(password, 10) // 密碼加密處理

        await prisma.users_test.create({
            data: {
                username,
                email,
                password: hashedPassword
            }
        })

        res.status(201).json({ message: '註冊成功' })
    } catch(err) {
        console.error('註冊失敗，錯誤訊息:', err);
        if(err.code === 'P2002') {
            return res.status(409).json({ message: '使用者已存在' })
        }

        res.status(500).json({ message: '伺服器錯誤' })
    }
})

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if(!token) {
        return res.status(401).json({ message: '沒有 token' })
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if(err) {
            return res.status(403).json({ message: 'token 無效' })
        }

        req.user = user
        next()
    })
}

app.get('/profile', authenticateToken, (req, res) => {
    res.json({ user: req.user })
})

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});