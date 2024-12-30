const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')

router.get('/cards', (req, res) => {
	const id = req.query.id

	try {
		const dirPath = path.join(__dirname, '../API_ID')
		const files = fs.readdirSync(dirPath)

		let foundCard = null
		for (const file of files) {
			const filePath = path.join(dirPath, file)
			const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

			const matchedCard = fileContent.find((card) => card.id === id)
			if (matchedCard) {
				foundCard = matchedCard
				break
			}
		}

		if (!foundCard) {
			return res.status(404).json({
				error: 'Card not found',
				message: `找不到 ID 為 ${id} 的卡片`,
				searchedId: id,
			})
		}

		res.json({
			id: foundCard.id,
			title: foundCard.title,
			cover: foundCard.cover,
			i18n: foundCard.i18n,
		})
	} catch (err) {
		console.error('處理請求時發生錯誤:', err)

		if (err.code === 'ENOENT') {
			return res.status(500).json({
				error: 'Directory not found',
				message: '卡片資料資料夾不存在',
			})
		}

		res.status(500).json({
			error: 'Server error',
			message: '處理請求時發生錯誤',
			details: err.message,
		})
	}
})

module.exports = router
