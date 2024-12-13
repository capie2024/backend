const express = require("express");
const { PrismaClient } = require("@prisma/client");


const router = express.Router();
const prisma = new PrismaClient();

// API：獲取 Deck 清單
router.get("/cardPDF", async (req, res) => {
  const { deckId } = req.query;
  if(!deckId){
    return res.status(400).json({ error:"請提供 Deck ID" })
  }

  try {
     // 查詢指定 deckId 的 deck 資料，獲取 deck 欄位中的所有 cover
    const deckData = await prisma.deck_list.findUnique({
      where: { deck_id: deckId },
      select: { deck: true ,deck_name: true }// 獲取 deck 跟 deck_name 欄位的資料
    });
  
    if(!deckData || !deckData.deck ){
      return res.status(404).json({ error: "未找到有效的 Deck 資料" });
    }
    

    // 確保 deckData.deck 是陣列並且包含 cover 資料
    if (!Array.isArray(deckData.deck)) {
    return res.status(400).json({ error: "'deck' 必須是一個陣列" });
  }
    // 從 deck 欄位中提取所有卡片的 cover
    const covers = deckData.deck
    .map(card => card.cover)
    .filter(cover => cover);

  // 返回所有 cover 圖片的 URL
    res.json({ covers ,deck_name: deckData.deck_name });
  } catch(error) {
    console.error("後端錯誤:",error)
    res.status(500).json({ error: "伺服器錯誤" });
  }
})


module.exports = router;
