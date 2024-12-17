const express = require("express");
const { PrismaClient } = require("@prisma/client");
const verifyToken = require("../middlewares/verifyToken");
const fetch = require("node-fetch");

const prisma = new PrismaClient();
const router = express.Router();
const dotenv = require("dotenv");
dotenv.config();

router.post("/create-paypal-order", async (req, res) => {
  //   const { userId } = req.user;
  const order = await createOrder();
  console.log(order);

  res.json({ id: order });
});

router.post("/get-paypal-order", async (req, res) => {
  const accessToken = await getAccessToken();
  const { orderID } = req.body;
  
const orderResponse = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });
  
  const orderData = await orderResponse.json();
  console.log(orderData);

    if(orderData.status !== "COMPLETED") {
        return res.status(400).json({ message: "付款失敗" });
    }else if(orderData.status === "COMPLETED") {
        
    }
});

router.get("/check-hero-member", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const isHeroMember = await prisma.users.findUnique({
        where: { id: userId },
        select: { is_hero_member: true },
    
    })


  }catch (error){

  }
})


// 建立新訂單
async function createOrder() {
  const accessToken = await getAccessToken();

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
            },
            reference_id: "XXXXXXXXXX",
          },
        ],
        intent: "CAPTURE",
      }),
    }
  ).then((response) => response.json());

  return data.id;
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
    throw new Error("Failed to fetch access token");
  }

  const data = await response.json();
  return data.access_token;
}

module.exports = router;
