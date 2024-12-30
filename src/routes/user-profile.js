const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const jwt = require('jsonwebtoken')

require('dotenv').config()

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET

router.get('/users', async (req, res) => {
	const authHeader = req.headers['authorization']
	const token = authHeader && authHeader.split(' ')[1]

	if (!token) {
		return res.status(401).json({ message: '沒有 token' })
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET)
		const user = await prisma.users.findUnique({
			where: {
				id: decoded.userId,
			},
		})
		res.json(user)
	} catch (error) {
		res.status(403).json({ message: 'token 無效' })
	}
})

module.exports = router
