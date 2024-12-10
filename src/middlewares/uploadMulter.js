const multer = require('multer')
const path = require('path')

// 配置 multer，處理檔案上傳
const uploadMulter = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 2 * 1024 * 1024,  // 限制文件大小為 2 MB
    },
    fileFilter (req, file, cb) {
       const ext = path.extname(file.originalname);
      // 限制文件格式為圖片
      if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
        const error = new Error(
          '圖片檔案格式不符，請上傳 jpg / jpeg / png 檔案。'
        )
        error.statusCode = 400;
        error.isOperational = true;
        return cb(error);
      } 
      cb(null, true)
    }
}).single('picture'); //只接收 formdata 中名爲 'image' 的欄位

module.exports = uploadMulter