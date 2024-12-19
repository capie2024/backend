const express = require("express");
const router = express.Router();
const fs = require("fs");

router.get('/series/:id', (req, res) => {
    const seriesId = req.params.id;
    const seriesData = fs.readFileSync(`./src/API_ID/${ seriesId }.json`, 'utf8');
    res.status(200).send(seriesData);
})

router.get('/series', (req, res) => {
    const seriesData = fs.readFileSync('./src/API_ID/series.json', 'utf8');
    res.status(200).send(seriesData);
})

module.exports = router