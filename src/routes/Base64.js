const express = require("express");
const router = express.Router();

// 提供字型資料的 API
router.get("/font", (req, res) => {
  try {
    // 載入字型的 Base64 資料
    const base64msyh = require("../font/fontBase64.js");

    // 確保返回的是 Base64 資料
    if (!base64msyh || typeof base64msyh !== "string") {
      throw new Error("字型資料格式不正確");
    }

    // 直接返回純粹的 Base64 字符串
    res.type("text/plain").send(base64msyh);
  } catch (error) {
    res.status(500).json({ error: "無法獲取字型資料" });
  }
});

module.exports = router;


