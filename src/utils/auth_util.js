const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const JWT_SECRET = process.env.JWT_SECRET

// hash 加密
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

// 比較密碼跟加密密碼
const comparePassword = async (password, hash) => bcrypt.compare(password, hash)

// 產生 JWT token
const generateToken = (userId) =>
  jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' })

module.exports = {
  hashPassword,
  comparePassword,
  generateToken
}