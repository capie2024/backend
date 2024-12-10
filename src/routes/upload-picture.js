const express = require('express')
const router = express.Router()
const { PrismaClient } = require("@prisma/client")
const jwt = require('jsonwebtoken')
const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier')
const multer = require('../middlewares/uploadMulter')

require('dotenv').config

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })

const uploadFromBuffer = (req) => {    
    return new Promise((resolve, reject) => {
      let cld_upload_stream = cloudinary.uploader.upload_stream(
        (error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        }
      );
  
      streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream);
    });
};

router.post('/users/upload-picture', multer, async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: '未提供 token' });
  }

  if (!req.file) {
    return res.status(400).json({ message: '未上傳檔案' });
  } 

  // 資料庫更新
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // 上傳圖片到 Cloudinary
    const image = await uploadFromBuffer(req);
    // 使用 Prisma 更新用戶的頭像
    await prisma.users.update({
      where: { id: decoded.userId },
      data: { picture: image.secure_url },
    });
    res.status(200).json({
      status: 'Success',
      message: '圖片上傳成功',
      data: {
        picture: image.secure_url,
      },
    });
  } catch (error) {
    console.error('更新用户頭像失敗：', error);
    res.status(500).json({ message: '更新用户頭像失敗' });
  }
});

module.exports = router;