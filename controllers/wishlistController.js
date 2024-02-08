const product = require('../models/productModel')
const user = require('../models/userModel')
const wishlist = require('../models/wishlistModel')
const cart = require('../models/cartModel')


// add to wishlist
// =-------------------------------------------------------------------
const addtowhishlist = async (req, res) => {
    try {
        console.log('suc');
        const productId = req.body.id
        const session = req.session.user_id
        const productData = await product.findOne({ _id: productId })
        const userData = await user.findOne({ _id: session })
        const whishListData = await wishlist.findOne({ user: userData._id })
        if (whishListData) {
            const wishExits = whishListData.product.findIndex((product) => product.productId == productId)
            if (wishExits != -1) {
                res.json({ productExit: true })
            } else {
                await wishlist.updateOne({ user: userData._id },
                    {
                        $push: {
                            product: [{
                                productId: productData._id,
                                name: productData.name,
                                price: productData.price
                            }]
                        }
                    })
            }
            res.json({ status: true })
        } else {
            console.log('yes')
            const whishList = new wishlist({
                user: userData._id,
                product: [{
                    productId: productData.id,
                    name: productData.name,
                    price: productData.price
                }]
            })
            await whishList.save()
            res.json({ status: true })
        }
    } catch (error) {
        console.log(error.message)
    }
}
// =-------------------------------------------------------------------\



// get wishlist
// =-------------------------------------------------------------------
const getWishlist = async (req, res) => {
    try {
        const session = req.session.user_id
        const userData = await user.findOne({ _id: session })
        const whishListData = await wishlist.findOne({ user: userData._id }).populate("product.productId")

        if (whishListData) {
            const products = whishListData.product
            res.render('wishlist', { session, userData, products,active:'wishlist' })
        }
        else {
            res.render('wishlist-empty', { session, userData, active:'wishlist' })
        }
    } catch (error) {
        console.log(error.message)
    }
}
// =-------------------------------------------------------------------





// wishlist to cart
// =-------------------------------------------------------------------
const addToCartFromWishlist = async (req, res) => {
    try {
        const productid = req.body.id
        const productData = await product.findById({ _id: productid })
        const session = req.session.user_id
        const userData = await user.findById({ _id: session })

        if(productData.stock<1){
            return res.status(400).json({ success: false, message: 'Out of stock' });
        }else{
            const cartData = await cart.findOne({ userId: session })
        if (cartData) {
            const productExists = await cartData.products.findIndex((argument) => argument.productId == productid)
            if (productExists != -1) {
                await wishlist.updateOne({ user: session }, { $pull: { product: { productId: productid } } })
                res.json({ success: true })
            } else {

                await cart.findOneAndUpdate({ userId: session }, { $push: { products: { productId: productid, productPrice: productData.price } } })
                await wishlist.updateOne({ user: session }, { $pull: { product: { productId: productid } } })
                res.json({ success: true })
            }

        } else {
            await wishlist.updateOne({ user: session }, { $pull: { product: { productId: productid } } })
            const newCart = new cart({
                userId:userData._id,
                    userName:userData.name,
                    products:[{
                        productId:productid,
                        productPrice:productData.price
                    }]
            })  
            const newCartData = await newCart.save() 
            if(newCartData){
                res.json({ success:true })
            }else{
                res.redirect('/wishlist')
            }
        }

        }

        
    } catch (error) {
        console.log(error.message)
    }
}
// =-------------------------------------------------------------------



// remove product from wishlist
// =-------------------------------------------------------------------
const removeProduct = async (req, res) => {
    try {
        const productid = req.query.id
        const session = req.session.user_id
        await wishlist.findOneAndUpdate({user:session},{$pull:{product:{productId:productid}}})
        res.redirect('/wishlist')
        
    } catch (error) {
        console.log(error.message)
    }
}
// =-------------------------------------------------------------------


module.exports = {
    addtowhishlist,
    getWishlist,
    addToCartFromWishlist,
    removeProduct
}