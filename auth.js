const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const { PrismaClient } = require('@prisma/client'); // 資料庫
const prisma = new PrismaClient(); // 建立 Prisma Client
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
// app.use('/auth', authRouter)

dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY;


// 註冊
    app.post("/register", async (req, res) => {
        const { email, password, username = "User" } = req.body;
    
        try {
        const existingUser = await prisma.users_test.findUnique({
            where: { email },
        });
    
        if (existingUser) {
            // Email 已存在，返回 409 狀態碼和訊息
            return res.status(409).json({ message: "Email 已被註冊過" });
        }
    
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.users_test.create({
            data: {
            email,
            password: hashedPassword,
            username,
            },
        });
    
        // 成功註冊，返回 200 狀態碼
        res.status(200).json({ message: "註冊成功" });
        } catch (error) {
        console.error("後端錯誤：", error); // 錯誤日誌
        res.status(500).json({ message: "伺服器錯誤" }); // 返回伺服器錯誤訊息
        }
    });

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