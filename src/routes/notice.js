const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const verifyToken = require('../middlewares/verifyToken')

router.get('/notices', verifyToken, async (req, res) => {
	try {
		const { userId } = req.user

		const userArticles = await prisma.article.findMany({
			where: { user_id: userId },
			select: {
				id: true,
				post_code: true,
				title: true,
			},
		})

		const articleIds = userArticles.map((article) => article.id)

		const comments = await prisma.comment.findMany({
			where: {
				article_id: { in: articleIds },
			},
			select: {
				id: true,
				created_at: true,
				user_id: true,
				article_id: true,
			},
			orderBy: {
				created_at: 'desc',
			},
		})

		const formattedNotices = []
		for (const comment of comments) {
			const article = userArticles.find((a) => a.id === comment.article_id)
			if (article) {
				const existingNotice = await prisma.notice.findFirst({
					where: {
						article_id: comment.article_id,
						comment_id: comment.id,
						user_id: userId,
					},
				})
				let notice

				if (!existingNotice) {
					notice = await prisma.notice.create({
						data: {
							is_read: false,
							article_id: comment.article_id,
							comment_id: comment.id,
							user_id: userId,
						},
					})
				} else {
					notice = existingNotice
				}

				formattedNotices.push({
					id: notice.id,
					created_at: comment.created_at,
					user_id: comment.user_id,
					post_code: article.post_code,
					title: article.title,
					is_read: notice.is_read,
				})
			}
		}

		const unreadCount = await prisma.notice.count({
			where: {
				article_id: { in: articleIds },
				is_read: false,
			},
		})

		// 返回結果
		res.json({
			unreadCount,
			notices: formattedNotices,
		})
	} catch (err) {
		console.error('Error fetching notices:', err)
		res.status(500).json({ error: 'Server Error' })
	}
})

router.post('/mark-as-read', verifyToken, async (req, res) => {
	try {
		const { userId } = req.user
		const { noticeId } = req.body

		if (!noticeId) {
			return res.status(400).json({ error: 'Notice ID is required' })
		}

		const updatedNotice = await prisma.notice.update({
			where: {
				id: noticeId,
				user_id: userId,
			},
			data: { is_read: true },
		})

		return res.status(200).json(updatedNotice)
	} catch (error) {
		console.error('Error updating notice:', error)
		return res.status(500).json({ error: 'Server error' })
	}
})

module.exports = router
