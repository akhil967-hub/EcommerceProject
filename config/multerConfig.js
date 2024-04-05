const multer = require('multer')
const sharp = require('sharp')
const fs = require('fs').promises;


const storage = multer.memoryStorage(); 

const upload = multer({ storage: storage }).array('image', 4); // '4' is the maximum number of images allowed

const processImages = async (req, res, next) => {
        try {
          if (req.files || req.files.length === 0) {
          
      
          const processedImages = [];
          for (const file of req.files) {
            const metadata = await sharp(file.buffer).metadata();
            const desiredWidth = 900;
            const desiredHeight = Math.round((metadata.height / metadata.width) * desiredWidth);
      console.log(file);
            const processedImageBuffer = await sharp(file.buffer)
              .resize({ width: desiredWidth, height: desiredHeight, fit: 'inside' })
              .webp()
              .toBuffer();
      
            // Save the processed image to a file
            const imagePath = `${Date.now()}-processed.webp`;
            await fs.writeFile('uploads/' + imagePath, processedImageBuffer);
      
            // Add the file path to the list of processed images
            processedImages.push(imagePath);
          }
          req.body.image = processedImages;
          next();
            }
         } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Please upload an image file' });
        }
    
      };

      module.exports = { upload, processImages };