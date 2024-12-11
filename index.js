const express = require('express');
const app = express();
const router = express.Router();
const port = 3000;
const cors = require('cors');
const path = require('path')
const dotenv = require('dotenv');
dotenv.config();

const login  = require('./src/routes/login');
const authRouter = require('./src/routes/auth');
const deckMake = require('./src/routes/deck-make');
const cardSeries = require('./src/routes/card-series');
const cardPDF = require("./src/routes/card-pdf");
const base64 = require("./src/routes/Base64")
const search = require("./src/routes/search-decks-articles");
const dailyCard = require('./src/routes/daily-card');

const userRouter = require('./src/routes/user-profile');
const uploadPic = require('./src/routes/upload-picture');
const updateName = require('./src/routes/update-name');
const userDecks = require('./src/routes/userDecks');
const userPosts = require('./src/routes/userPosts');
const commentsRoute = require('./src/routes/comments-with-verifytoken');

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
app.use(require('./src/routes/google-auth'));
app.use('/api', router);
app.use('/api', deckMake);
app.use('/api', cardSeries);
app.use('/api', cardPDF);
app.use('/api', base64);
app.use('/api', search);
app.use('/api', dailyCard);
app.use('/api', commentsRoute);


app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
