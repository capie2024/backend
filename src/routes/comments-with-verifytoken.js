const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const verifyToken = require('../middlewares/verifyToken')

router.get('/currentUser', verifyToken, async (req, res) => {
	const { userId } = req.user

	const user = await prisma.users.findUnique({
		where: { id: parseInt(userId) },
		select: {
			username: true,
			picture: true,
		},
	})
	if (!user) {
		return res.status(404).json({ error: 'User not found' })
	}

	res.status(200).json(user)
})

router.get('/article-id/:post_code', async (req, res) => {
	const { post_code } = req.params

	const article = await prisma.article.findUnique({
		where: { post_code },
		select: {
			id: true,
			user_id: true,
			title: true,
			content: true,
			created_at: true,
			post_picture: true,
		},
	})

	if (article) {
		const user = await prisma.users.findUnique({
			where: { id: article.user_id },
			select: {
				username: true,
				picture: true
			} 
		})

		if (user) {
			res.json({
				article_id: article.id,
				user_id: article.user_id,
				title: article.title,
				content: article.content,
				created_at: article.created_at,
				post_picture: article.post_picture,
				user_picture: user.picture,
				user_name: user.username,
			})
		} else {
			return res.status(404).json({ message: 'User not found' })
		}
	} else {
		return res.status(404).json({ message: 'Article not found' })
	}
})

router.get('/comments', async (req, res) => {
	const { articleId } = req.query

	try {
		if (!articleId) {
			return res.status(400).json({ error: 'articleId parameter is required' })
		}

		const messages = await prisma.comment.findMany({
			where: { article_id: parseInt(articleId, 10) },
			orderBy: { created_at: 'desc' },
			include: {
				users: true,
				reaction: true,
			},
		})

		const formattedMessages = messages.map((message) => {
			const latestReaction = message.reaction.sort((a, b) => {
				return new Date(b.created_at) - new Date(a.created_at)
			})[0]

			console.log('Message Comment Reactions:', message.reaction)
			console.log('Latest Reaction:', latestReaction)

			return {
				id: message.id,
				user_id: message.user_id,
				article_id: message.article_id,
				message: message.message,
				like_count: message.like_count,
				created_at: message.created_at,
				users: message.users,
				isLiked: latestReaction ? latestReaction.liked : false,
				isHated: latestReaction ? latestReaction.disliked : false,
			}
		})

		console.log('Formatted Messages:', formattedMessages)
		res.json(formattedMessages)
	} catch (error) {
		console.error('Error fetching comments:', error)
		return res.status(500).json({ error: error.message })
	}
})

router.post('/send-message', verifyToken, async (req, res) => {
	const { messageData } = req.body
	const { userId } = req.user

	try {
		const comment = await prisma.comment.create({
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
				article: { select: { post_code: true } },
			},
		})
		res.status(201).json(comment)
	} catch (error) {
		console.error('錯誤訊息:', error.message)
		res.status(500).json({ error: error.message })
	}
})

router.put('/comments/:id', async (req, res) => {
	const { id } = req.params
	const { message } = req.body

	try {
		const updatedComment = await prisma.comment.update({
			where: { id: parseInt(id) },
			data: {
				message,
				created_at: new Date(),
			},
		})
		res.json(updatedComment)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

router.delete('/comments/:id', async (req, res) => {
	const { id } = req.params

	try {
		const existingComment = await prisma.comment.findUnique({
			where: { id: parseInt(id) },
		})
		if (!existingComment) {
			return res.status(404).json({ error: 'Comment not found.' })
		}
		const deletedComment = await prisma.comment.delete({
			where: { id: parseInt(id) },
		})

		await prisma.notice.deleteMany({
			where: { comment_id: parseInt(id) },
		})

		res.json({
			success: true,
			message: 'Comment and related notices deleted successfully.',
			deletedComment,
		})
	} catch (error) {
		console.error('刪除失敗', error.message)
		res.status(500).json({ error: 'Failed to delete the comment.' })
	}
})

router.post(
	'/comments/:commentId/toggleLike',
	verifyToken,
	async (req, res) => {
		const { commentId } = req.params
		const { userId } = req.user

		try {
			let reaction = await prisma.reaction.findFirst({
				where: {
					comment_id: Number(commentId),
					user_id: Number(userId),
				},
			})

			let isLiked, likeAdjustment

			if (reaction) {
				// 更新已存在的 reaction
				isLiked = !reaction.liked
				likeAdjustment = isLiked ? 1 : -1

				await prisma.reaction.update({
					where: { id: reaction.id },
					data: {
						liked: isLiked,
						disliked: false,
					},
				})
			} else {
				// 創建新的 reaction
				isLiked = true
				likeAdjustment = 1

				await prisma.reaction.create({
					data: {
						comment_id: Number(commentId),
						user_id: Number(userId),
						liked: true,
						disliked: false,
						created_at: new Date(),
					},
				})
			}

			const updatedComment = await prisma.comment.update({
				where: { id: Number(commentId) },
				data: { like_count: { increment: likeAdjustment } },
			})

			return res.status(200).json({
				isLiked,
				isHated: false,
				likeCount: updatedComment.like_count,
			})
		} catch (error) {
			console.error('切換 Like 時發生錯誤:', error)
			return res.status(500).json({ message: '伺服器錯誤' })
		}
	}
)

router.post(
	'/comments/:commentId/toggleHate',
	verifyToken,
	async (req, res) => {
		const { commentId } = req.params
		const { userId } = req.user

		try {
			// 檢查是否存在 reaction
			let reaction = await prisma.reaction.findFirst({
				where: {
					comment_id: Number(commentId),
					user_id: Number(userId),
				},
			})

			let isHated,
				likeAdjustment = 0

			if (reaction) {
				// 更新已存在的 reaction
				isHated = !reaction.disliked

				if (reaction.liked && isHated) {
					likeAdjustment = -1 // 如果取消 like
				}

				await prisma.reaction.update({
					where: { id: reaction.id },
					data: {
						disliked: isHated,
						liked: reaction.liked && !isHated ? reaction.liked : false, // 如果 hate，取消 like
					},
				})
			} else {
				// 創建新的 reaction
				isHated = true

				await prisma.reaction.create({
					data: {
						comment_id: Number(commentId),
						user_id: Number(userId),
						liked: false,
						disliked: true,
						created_at: new Date(),
					},
				})
			}

			// 更新 like_count
			const updatedComment = await prisma.comment.update({
				where: { id: Number(commentId) },
				data: { like_count: { increment: likeAdjustment } },
			})

			return res.status(200).json({
				isLiked: likeAdjustment === -1 ? false : reaction?.liked || false,
				isHated,
				likeCount: updatedComment.like_count,
			})
		} catch (error) {
			console.error('切換 Hate 時發生錯誤:', error)
			return res.status(500).json({ message: '伺服器錯誤' })
		}
	}
)

module.exports = router
