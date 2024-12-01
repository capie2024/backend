const express = require("express");
const router = express.Router();
const fs = require("fs");

router.get('/serise/:id', (req, res) => {
    const seriesId = req.params.id;
    const seriesData = fs.readFileSync(`./API/${ seriesId }.json`, 'utf8');
    res.status(200).send(seriesData);
})

module.exports = router