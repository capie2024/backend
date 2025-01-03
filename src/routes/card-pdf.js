const express = require('express')
const { PrismaClient } = require('@prisma/client')

const router = express.Router()
const prisma = new PrismaClient()

// API：根據 input 查詢對應的 deck 資料並返回 cover 圖片和 deck_name
router.get('/cardPDF', async (req, res) => {
	const { input } = req.query

	// 檢查是否提供了有效的輸入參數
	if (!input || typeof input !== 'string' || input.trim() === '') {
		return res.status(400).json({ error: '請提供有效的輸入參數' })
	}

	try {
		let deckListData

		// 第一種情況：如果 input 是 post_code，先查詢 article 表格，根據 post_code 查找對應的 deck_id
		const articleData = await prisma.article.findUnique({
			where: { post_code: input }, // 根據 post_code 查詢
			select: { deck_id: true }, // 只選擇 deck_id 欄位
		})

		// 如果是 post_code，且找到對應的 deck_id
		if (articleData && articleData.deck_id) {
			// 查詢 deck_list 表格，根據 deck_id 查找對應的資料
			deckListData = await prisma.deck_list.findUnique({
				where: { id: articleData.deck_id }, // 使用 article 查到的 deck_id 查找 deck_list
				select: { deck_id: true, deck_name: true, deck: true }, // 選擇 deck_id、deck_name 和 deck 欄位
			})

			if (!deckListData) {
				return res.status(404).json({ error: '未找到對應的 Deck 資料' })
			}

			// 提取 deck 裡面所有的 cover
			const covers = deckListData.deck
				.map((card) => card.cover)
				.filter((cover) => cover)

			// 回傳 deck 資料、deck_name 和 cover 圖片
			return res.json({
				deck_id: deckListData.deck_id,
				deck_name: deckListData.deck_name,
				covers: covers,
			})
		}

		// 第二種情況：如果 input 是 deck_id，直接查詢 deck_list 表格
		deckListData = await prisma.deck_list.findUnique({
			where: { deck_id: input }, // 根據 deck_id 查詢
			select: { deck_id: true, deck_name: true, deck: true }, // 選擇 deck_id、deck_name 和 deck 欄位
		})

		// 如果找到對應的 deck 資料
		if (deckListData) {
			// 提取 deck 裡面所有的 cover
			const covers = deckListData.deck
				.map((card) => card.cover)
				.filter((cover) => cover)

			// 回傳 deck 資料、deck_name 和 cover 圖片
			return res.json({
				deck_id: deckListData.deck_id,
				deck_name: deckListData.deck_name,
				covers: covers,
			})
		} else {
			return res.status(404).json({ error: '未找到對應的 Deck 資料' })
		}
	} catch (error) {
		console.error('後端錯誤:', error)
		res.status(500).json({ error: '伺服器錯誤' })
	}
})

module.exports = router
