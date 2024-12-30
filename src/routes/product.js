const express = require('express')
const router = express.Router()
const fetch = require('node-fetch') // 確保已安裝 node-fetch

// 定義路由來獲取產品資料
router.get('/product', async (req, res) => {
	try {
		const response = await fetch('https://bottleneko.app/api/product')

		if (!response.ok) {
			throw new Error(`外部 API 回應失敗，狀態碼：${response.status}`)
		}

		const data = await response.json()
		res.status(200).json({
			success: true,
			data,
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
})

module.exports = router
