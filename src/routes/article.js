const express = require('express')
const { PrismaClient } = require('@prisma/client')
const verifyToken = require('../middlewares/verifyToken')

const multer = require('../middlewares/uploadMulter')
const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier')

const { v4: uuidv4 } = require('uuid')

const prisma = new PrismaClient()
const router = express.Router()
const dotenv = require('dotenv')
dotenv.config()

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
					resolve(result)
				} else {
					reject(error)
				}
			}
		)

		streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream)
	})
}

const checkArticleId = async () => {
	const articleId = uuidv4().slice(0, 5)
	const articleIdCheck = await prisma.article.findUnique({
		where: {
			post_code: articleId,
		},
	})

	if (articleIdCheck) {
		return checkArticleId()
	} else {
		return articleId
	}
}

router.post('/articles', verifyToken, multer, async (req, res) => {
	const articleId = await checkArticleId()

	const { deck_id, title, content } = req.body
	const { userId } = req.user

	const deckId = deck_id ? parseInt(deck_id, 10) : null

	if (!userId) {
		return res.status(400).json({ error: '用戶信息無效' })
	}

	const user = await prisma.users.findUnique({
		where: { id: userId },
		select: { username: true, picture: true },
	})

	if (!user) {
		return res.status(404).json({ error: '找不到該用戶' })
	}

	let postPicture = null
	if (req.file) {
		const cloudinaryResponse = await uploadFromBuffer(req)
		postPicture = cloudinaryResponse.secure_url
	} else if (req.body.post_picture) {
		postPicture = req.body.post_picture
	}

	try {
		const article = await prisma.article.create({
			data: {
				deck_id: deckId,
				post_code: articleId,
				title,
				content,
				user_id: userId,
				post_picture: postPicture,
			},
		})

		res.status(201).json({
			...article,
			username: user.username,
			picture: user.picture,
		})
	} catch (error) {
		console.error('Error:', error)
		res.status(500).json({ error: '無法儲存文章', message: error.message })
	}
})

router.post('/decks', verifyToken, async (req, res) => {
	const { title, content, deck_id, post_picture } = req.body
	const { userId } = req.user

	if (!userId) {
		return res.status(400).json({ error: '用戶信息無效' })
	}

	const user = await prisma.users.findUnique({
		where: { id: userId },
		select: { username: true, picture: true },
	})

	if (!user) {
		return res.status(404).json({ error: '找不到該用戶' })
	}

	const articleId = await checkArticleId()

	try {
		const article = await prisma.article.create({
			data: {
				user_id: userId,
				deck_id,
				post_code: articleId,
				title,
				content,
				post_picture,
			},
		})

		res.status(201).json({
			...article,
			username: user.username,
			picture: user.picture,
		})
	} catch (error) {
		console.error('Error:', error)
		res.status(500).json({ error: '無法儲存文章', message: error.message })
	}
})

router.get('/articles', async (req, res) => {
	const articles = await prisma.article.findMany({
		include: {
			users: {
				select: {
					username: true,
					picture: true,
				},
			},
			deck_list: {
				select: {
					deck: true,
				},
			},
		},
	})

	res.status(200).json(articles)
})

router.get('/articles/:post_code', async (req, res) => {
	const { post_code } = req.params

	try {
		const article = await prisma.article.findUnique({
			where: { post_code },
			include: {
        deck_list: { 
          select: {
            deck_name: true
          }
        }
      },
		})

		if (!article) {
			return res.status(404).json({ error: '文章未找到' })
		}

		res.status(200).json(article)
	} catch (error) {
		res.status(500).json({ error: '無法獲取文章資料', message: error.message })
	}
})

router.delete('/articles/:post_code', verifyToken, async (req, res) => {
	const { post_code } = req.params

	const deletedPost = await prisma.article.delete({
		where: { post_code },
	})
	res.json({ success: true, message: '文章刪除成功', deletedPost })
})

router.put('/articles/:post_code', verifyToken, async (req, res) => {
  const { post_code } = req.params;
  const { title, content } = req.body;
  
  try {
    const updatedPost = await prisma.article.update({
      where: { post_code },
      data: {
        title: title ,
        content: content ,
      },
    
    });
    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

router.get('/my', verifyToken, async (req, res) => {
	try {
		const { userId } = req.user
		const articles = await prisma.article.findMany({
			where: { user_id: userId },
			include: {
				users: {
					select: {
						username: true,
						picture: true,
					},
				},
			},
		})
		res.status(200).json(articles)
	} catch (error) {
		res.status(500).json({ message: '獲取文章失敗' })
	}
})

module.exports = router
