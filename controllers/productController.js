const products = require('../models/productModel')
const category = require('../models/categoryModel')
const session = require('express-session')

// GET PRODUCTS PAGE
// ---------------------------------------------------------------------------------
const getProducts = async (req, res) => {
    try {
        
        const productsData = await products.find()
        res.render('products', { message: productsData, active:"products" })
    } catch (error) {
        console.log(error)
    }
}
// ---------------------------------------------------------------------------------



// GET ADD PRODUCTS PAGE
// ---------------------------------------------------------------------------------
const getAddProducts = async (req, res) => {
    try {
        const categoryData = await category.find({ is_block: 0 })
        res.render('add-products', { categoryData, active:"products" })
    } catch (error) {
        console.log(error)
    }
}
// ---------------------------------------------------------------------------------


// POST ADD PRODUCTS  -- add product details to db
// ---------------------------------------------------------------------------------
const addProduct = async (req, res) => {
    try {
        // const img = []
        // for (i = 0; i < req.files.length; i++) {
        //     img[i] = req.files[i].filename
        // }
        
        
        if (req.body.stock <= 0) {
           req.body.status = 'Out Of Stock'
        }else{
            req.body.status = 'In Stock'
        }
        // const productData = new products({
        //     name: req.body.name,
        //     price: req.body.price,
        //     category: req.body.category,
        //     description: req.body.description,
        //     image: img,
        //     stock: req.body.stock,
        //     status: status
        // })
         await products.create(req.body)
        res.redirect('/admin/products')

    }
    catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");

    }
}
// ---------------------------------------------------------------------------------


// DELETE A PRODUCT
// ---------------------------------------------------------------------------------
const deleteProduct = async (req, res) => {
    try {
        const id = req.query.id
        await products.deleteOne({ _id: id })
        res.redirect('/admin/products')
    } catch (error) {
        console.log(error)
    }
}
// ---------------------------------------------------------------------------------


// GET EDIT PRODUCT
// ---------------------------------------------------------------------------------
const editProduct = async (req, res) => {
    try {
        const id = req.query.id
        const productData = await products.findById({ _id: id })
        console.log(productData);
        const categoryData = await category.find({ is_block: 0 })
        
        if (productData) {
            res.render('edit-product', { productData, categoryData, active:"products" })
        }
        else {
            res.redirect('/admin/products')
        }

    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");  

    }
}
// ---------------------------------------------------------------------------------




// POST EDIT PRODUCT   updates edited data to db
// ---------------------------------------------------------------------------------
const postEditProduct = async (req, res) => {
    try {
        let status;
        if (req.body.stock <= 0) {
            status = 'Out Of Stock'
        }else{
            status = 'In Stock'
        }
        const id = req.body.id
         const filesArray = req.files
        const filenamesArray = filesArray.map(file => file.filename);

        if (req.files) {
            const newData = await products.updateMany({ _id: id }, {
                $set: {
                    name: req.body.name,
                    price: req.body.price,
                    category: req.body.category,
                    description: req.body.description,
                    stock: req.body.stock,
                    status: status
                },
                $push: {
                    image: { $each: filenamesArray } // Using $each to push multiple values
                
            }
            })

            res.redirect('/admin/products')
        }
        else {
            const newData = await products.updateMany({ _id: id }, {
                $set: {
                    name: req.body.name,
                    price: req.body.price,
                    category: req.body.category,
                    description: req.body.description,
                    stock: req.body.stock,
                    status: status
                }
            })

            res.redirect('/admin/products')

        }

    } catch (error) {
        console.log(error.message)
        return res.status(500).send("Internal Server Error");  

    }
}




const deleteImage = async (req, res) => {
    try {
        console.log(req.body.position)
        const position = req.body.position
        const id = req.body.id

        const productImage = await products.findById(id)

        const image = productImage.image[position]
        const data = await products.updateOne({ _id: id }, { $pullAll: { image: [image] } })

        if (data) {
            res.json({ success: true })
        } else {
            res.redirect('/admin/products')
        }
    } catch (error) {

        console.log(error.message);
        return res.status(500).send("Internal Server Error");  


    }
}

// const productImage = async (req, res) => {
//     try {
//       const productId = req.params.productId;
//       const image = req.params.imageIndex;
//       console.log(image.data);

      
  
//       // Fetch the product from the database
//       const product = await products.findById(productId);
//       console.log(product);
  
//       if (!product || !product.image || product.image.length <= 0) {
//         return res.status(404).send('Image not found');
//       }
        
//         const croppedImage = await Jimp.read
//    (image);
//    croppedImage.crop(100, 50, 470, 270)
//    .write('../static/admin/productimages/croped.jpg');
  
      
//       res.send( croppedImage);
//       res.status(400).send('hallo')
//     } catch (error) {
//       console.error(error.message);
//       res.status(500).send('Internal Server Error');
//     }
//   };


const productImage = async (req, res) => {
    try {
        const productId = req.params.productId;
        const image = req.params.imageIndex;

        // ... Your existing code to fetch and process the image ...

        res.send(image); // Or send a JSON response if needed
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



module.exports = {
    getProducts,
    getAddProducts,
    addProduct,
    deleteProduct,
    editProduct,
    postEditProduct,
    deleteImage,
    productImage
}