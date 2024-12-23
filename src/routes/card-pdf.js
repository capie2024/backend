const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// API：獲取 Deck 清單
router.get("/cardPDF", async (req, res) => {
  const { deckId, postCode } = req.query;

  // 檢查是否提供了 deckId 或 postCode
  if (!deckId && !postCode) {
    return res.status(400).json({ error: "請提供 Deck ID 或 Post Code" });
  }

  try {
    let deckData;

    if (deckId) {
      // 若提供 deckId，查詢 deck_list 資料
      deckData = await prisma.deck_list.findUnique({
        where: { deck_id: deckId },
        select: { deck: true, deck_name: true },
      });
    } else if (postCode) {
      // 檢查 postCode 是否正確格式
      if (typeof postCode !== "string" || postCode.trim() === "") {
        return res.status(400).json({ error: "Post Code 格式不正確" });
      }
      // 若提供 postCode，查詢 add_article 資料，並取得對應的 deck_id
      const articleData = await prisma.add_article.findUnique({
        where: { post_code: postCode },
        select: { deck_id: true },
      });

      if (!articleData || !articleData.deck_id) {
        return res.status(404).json({ error: "未找到對應的 Deck 資料" });
      }

      // 查詢對應 deck_id 的 deck_list 資料
      deckData = await prisma.deck_list.findUnique({
        where: { deck_id: articleData.deck_id },
        select: { deck: true, deck_name: true },
      });
    }

    if (!deckData || !deckData.deck) {
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
    res.json({ covers, deck_name: deckData.deck_name });
  } catch (error) {
    console.error("後端錯誤:", error);
    res.status(500).json({ error: "伺服器錯誤" });
  }
});

module.exports = router;

