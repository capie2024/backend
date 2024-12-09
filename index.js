const express = require('express');
const app = express();
const router = express.Router();
const port = 3000;
const cors = require('cors');
const path = require('path')
// const mysql = require('mysql2')
const login  = require('./src/routes/login');
const authRouter = require('./src/routes/auth');
const deckMake = require('./src/routes/deck-make');
const cardSeries = require('./src/routes/card-series');
const cardPDF = require("./src/routes/card-pdf");
const base64 = require("./src/routes/Base64")
const dailyCard = require('./src/routes/daily-card');


const userRouter = require('./src/routes/user-profile');
const uploadPic = require('./src/routes/upload-picture');
const updateName = require('./src/routes/update-name');
const userDecks = require('./src/routes/userDecks');
const userPosts = require('./src/routes/userPosts');
const commentsRouter = require('./src/routes/comments-with-verifytoken');

app.use(cors());

// middleware
app.use(express.json());

app.use('/api', login);
app.use('/auth', authRouter);
app.use(require('./src/routes/google-auth'));
app.use(userRouter);
app.use(uploadPic);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(updateName);
app.use(userDecks);
app.use(userPosts);
// const db = mysql.createPool({
//   host: "dev-testdb.ctcm8i88mnas.ap-northeast-1.rds.amazonaws.com",
//   user: "admin",
//   password: "Aa10211395",
//   database: "project-test",
// })

router.post('/signup', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], (error, results) => {
    if (error) {
      return res.status(500).json({ message: '註冊失敗' });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: '此 email 已註冊' });
    }

    db.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, password], (error, results) => {
      if (error) {
        return res.status(500).json({ message: '註冊失敗' });
      }

      res.json({ message: '註冊成功' });
    });
  });
});
// app.use(require('./src/routes/google-auth'));

app.use('/api', router);
app.use('/api', deckMake);
app.use('/api', cardSeries);
app.use('/api', cardPDF);
app.use('/api', base64)
app.use('/api', dailyCard);
app.use('/api', commentsRouter);

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
