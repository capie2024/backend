const express = require('express')
const router = express.Router()

router.get('/cards/:id',  (req, res) => {
  const id = req.params.id
  console.log(id);
  
  const directoryPath = path.join(__dirname, '../API_ID')
  const files = fs.readdirSync(directoryPath).filter(file => file.includes(id))
  if (files.length > 0) {
    const cover = files.cover
    const title = files.title
    res.json({ cover, title })
  } else {
    res.status(404).json({ error: 'Cover not found' })
  }
})

module.exports = router