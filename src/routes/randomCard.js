const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')

// 亂數打亂陣列的函數
const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

router.get('/cards/random', (_req, res) => {
    // 計算 API_ID 資料夾中有多少檔案
    const fileCount = fs.readdirSync('./src/API_ID').length;

    const apiIdDir = path.join(__dirname, '../API_ID')
    // 列出 API_ID 所有檔案名稱
    const files = fs.readdirSync(apiIdDir)

    // const randomFile = files[Math.floor(Math.random() * fileCount)]
    // const filePath = path.join(apiIdDir, randomFile)
    
    // 隨機打亂檔案陣列
    const shuffledFiles = shuffleArray(files)
    const covers = []
    const maxCovers = 50
    
    // 迭代檔案並收集 cover 連結
    for (const file of shuffledFiles) {
        if (covers.length >= maxCovers) break;
        const filePath = path.join(apiIdDir, file);
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            const jsonData = JSON.parse(data);
            if (Array.isArray(jsonData)) {
                const fileCovers = jsonData.map(item => item.cover).filter(cover => cover);
                covers.push(...fileCovers);
            } else {
                if (jsonData.cover) {
                    covers.push(jsonData.cover);
                }
            }
        } catch (err) {
            console.error(`讀取或解析檔案 ${file} 失敗：`, err);
            // 可以選擇繼續或中斷，這裡選擇繼續
            continue;
        }
    }
    // 確保最多回傳 50 個連結
    const limitedCovers = covers.slice(0, maxCovers);
    res.status(200).json({ covers: limitedCovers });
    
});

module.exports = router;