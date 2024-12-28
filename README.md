# 卡派Capie server

以下將會引導你如何安裝此專案到你的電腦上。

## 取得專案

https://github.com/capie2024/backend

## 移動到專案內

```以下將會引導你如何安裝此專案到你的電腦上。
cd server
```

## 安裝套件

```以下將會引導你如何安裝此專案到你的電腦上。
npm install
```

### 運行專案

```sh
npm run dev
```
### 環境變數設定

請在終端機輸入 `cp .env.example`來複製 .env.example 檔案，並依據 `.env` 內容調整相關欄位。

### 開啟專案

在瀏覽器網址列輸入以下即可看到畫面

```sh
http://localhost:3000/
```
## 環境變數說明

```env
DATABASE_URL= #資料庫位置
JWT_SECRET=
GOOGLE_CLIENT=
GOOGLE_CLIENT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=

```

## 資料夾說明

- prisma  資料庫格式放置處
- API_ID  卡牌資料放置處
- routes  API路徑放置處
- middlewares  中間件放置處

## 專案技術

- prisma/client 5.22.0
- bcrypt 5.1.1
- cloudinary 2.5.1
- cors 2.8.5
- dotenv 16.4.5
- express 4.21.1
- google-auth-library 9.15.0
- jsonwebtoken 9.0.2
- multer 1.4.5-lts.1
- mysql 2.18.1
- nodemon 3.1.7
- passport 0.7.0
- passport-google-oauth20 2.0.0
- prisma 5.22.0
- streamifier 0.1.1
- uuid 11.0.3
- zod 3.23.8

## 聯絡作者
 可以透過以下方式與我們聯絡
 
### 團隊成員
- 旻叡 :https://github.com/minjuilu
- 佳樺 :https://github.com/wuuhua
- 宗倫 :https://github.com/allen84324
- 代賢 :https://github.com/Wandaihsien 
- 宜臻 :https://github.com/Enya-Wu
- 景淵 :https://github.com/Kenny1238
- 昱丞 :https://github.com/YuCheng07
