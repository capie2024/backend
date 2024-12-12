const express = require('express')
const { PrismaClient } = require('@prisma/client') 
const { v4: uuidv4 } = require("uuid");
const verifyToken = require('../middlewares/verifyToken');

const prisma = new PrismaClient() 
const router = express.Router()
const dotenv = require('dotenv')
dotenv.config()

router.post('/articles', verifyToken, async (req, res) => {
  try {

    const { title, content } = req.body;
    const { userId } = req.user;
   
    if (!userId) {
      return res.status(400).json({ error: '用戶信息無效' });
    }


    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { username: true, picture: true },
    });

    
    if (!user) {
      return res.status(404).json({ error: '找不到該用戶' });
    }

    const articleId = await checkArticleId();

    const article = await prisma.add_article.create({
      data: {
        post_code: articleId,
        title,
        content,
        user_id:userId,
      },
    });

    res.status(201).json({
      ...article,
      username: user.username,
      picture: user.picture,
    });

  } catch (error) {
    console.error('Error:', error);  
    res.status(500).json({ error: '無法儲存文章', message: error.message });
  }
});

async function checkArticleId() {
  let articleId = uuidv4().slice(0, 5);
  const articleIdCheck = await prisma.add_article.findUnique({
    where: {
      post_code: articleId,
    },
  });

  if (articleIdCheck) {
    return checkArticleId(); 
  } else {
    return articleId;
  }
}


router.get('/articles', async (req, res) => {
  try {
    const articles = await prisma.add_article.findMany({
      include: {
        users: { // 關聯查詢 users 表格
          select: {
            username: true,
            picture: true
          }
        }
      }
    });

    res.status(200).json(articles);
  } catch (error) {
    res.status(500).json({ error: '無法獲取文章資料', message: error.message });
  }
});



module.exports = router