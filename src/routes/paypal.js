const express = require("express");
const { PrismaClient } = require("@prisma/client");
const verifyToken = require("../middlewares/verifyToken");
const fetch = require("node-fetch");

const prisma = new PrismaClient();
const router = express.Router();
const dotenv = require("dotenv");
dotenv.config();

// 建立新訂單
router.post("/create-paypal-order", verifyToken, async (req, res) => {
  const order = await createOrder();
  res.json({ order: order });
});


// 將使用者及訂單紀錄寫入資料庫的order_list
router.post("/save-paypal-order", verifyToken, async (req, res) => {
  const { userId } = req.user;
  const { order } = req.body;
  const response = await prisma.order_list.create({
    data: {
      user_id: parseInt(userId),
      order_id: order.id 
    }
  })
  
  res.status(200).json({ response })
})

// 確認是否已經有付費會員的訂單紀錄
router.get("/check-hero-member", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const isHeroMember = await prisma.order_list.findUnique({
        where: { user_id: userId }
    })
    
    if(isHeroMember){
      res.status(200).json({ message: "已有付費會員紀錄", isHeroMember: true })
    }else{
      res.status(200).json({ message: "沒有付費會員紀錄", isHeroMember: false })
    }
  }catch (error){
      res.status(500).json({ error: error.message });
  }
})


// 建立新訂單的function
async function createOrder() {
  const accessToken = await getAccessToken();

  try {
    const data = await fetch(
      "https://api-m.sandbox.paypal.com/v2/checkout/orders",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          purchase_units: [
            {
              amount: {
                currency_code: "USD",
                value: "12.00",
              }
            },
          ],
          intent: "CAPTURE",
        }),
      }
    ).then((response) => response.json());
  
    return data;
    
  } catch (error) {
    return error
  }
}


async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const response = await fetch(
    "https://api-m.sandbox.paypal.com/v1/oauth2/token",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    }
  );

  if (!response.ok) {
    throw new Error("無法取得access token");
  }

  const data = await response.json();
  return data.access_token;
}

module.exports = router;
