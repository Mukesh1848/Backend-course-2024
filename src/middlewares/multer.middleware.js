import multer from "multer";

// Multer is a node.js middleware for handling multipart/form-data, which is primarily used for uploading files.

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "/public/temp") // Checking destination from directory(C,D,E,F etc...)
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
  
export const upload = multer({ 
    storage, 
})