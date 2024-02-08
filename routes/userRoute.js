const express = require('express')
const user_route = express()
const config = require('../config/config')
const session = require('express-session')
const auth = require('../middlewares/auth')
const nocache = require('nocache')


const { getHome,
    getLogin,
    getRegister,
    postRegister,
    postLogin,
    getProfile,
    userLogout,
    getOtpPage,
    verifyOtp,
    getProductPage,
    resendOtp,
    getShopPage,
    getMyOrders,
    getSingleOrderView,
    editProfile,
    updateProfile,
    loadwallet} = require('../controllers/userController')
const forgotController = require('../controllers/forgotController')
const cartController = require('../controllers/cartController')
const orderController = require('../controllers/orderController')
const wishlistController = require('../controllers/wishlistController') 
const couponController = require('../controllers/couponsController')




user_route.set('view engine','ejs')
user_route.set('views','./views/users')

user_route.use(session({
    secret:config.sessionSecret,
    saveUninitialized:true,
    resave:false,
    cookie:{maxAge : 9000000},
}))

user_route.use(express.json())
user_route.use(express.urlencoded({extended:true}))


// USER CONTROLLER

user_route.get('/',nocache(),auth.isUserLogin,getHome)
user_route.get('/shop',nocache(),auth.isUserLogin,getShopPage)
user_route.get('/login',auth.isLoginHome,getLogin)
user_route.get('/register',nocache(),getRegister)
user_route.get('/profile',nocache(),auth.isLogin,getProfile)
user_route.get('/edit',nocache(), auth.isLogin,editProfile)
user_route.get('/user-logout',nocache(),auth.isLogin,userLogout)
user_route.get('/otp-page',getOtpPage)
user_route.get('/product',nocache(),auth.isLogin,getProductPage)
user_route.get('/resend-otp',resendOtp)
user_route.get('/myorders',nocache(),auth.isLogin, getMyOrders)
user_route.get('/singleorderview',nocache(), getSingleOrderView)
user_route.get('/wallet',auth.isLogin,loadwallet)




user_route.post('/login',postLogin)
user_route.post('/register',postRegister)
user_route.post('/otp-page',verifyOtp) 
user_route.post('/edit',updateProfile)


// FORGOT PASSWORD

user_route.get('/forgotpassword', auth.isLoginHome, forgotController.loadforgotpassword)
user_route.get('/forgotpassword/otp', forgotController.loadforgototp)
user_route.get('/restpassword', forgotController.loadresetpassword)

user_route.post('/restpassword', forgotController.resetpassword)
user_route.post('/forgotpassword', forgotController.verifymail)
user_route.post('/forgotpassword/otp', forgotController.verifyforgototp)

// CART CONTROLLER

user_route.get('/cart', auth.isLogin, cartController.getCart)
user_route.get('/checkout', auth.isLogin,cartController.getCheckout)
user_route.get('/add-address', auth.isLogin,cartController.getAddAddress)
user_route.get('/removeproduct', auth.isLogin, cartController.removeProduct)
user_route.get('/edit-address', cartController.getEditAddress);



user_route.post('/addToCart', cartController.addToCart)
user_route.post('/add-address', cartController.postAddAddress)
user_route.post('/edit-address', cartController.postEditAddress);
user_route.post('/delete-address/:index',cartController.deleteAddress);
user_route.delete('/removeproduct',auth.isLogin,cartController.postremoveProduct)
user_route.patch('/cartqntyincrese',auth.isLogin,cartController.cartQuantityIncrese,cartController.totalproductprice)


// ORDER CONTROLLER


user_route.get('/editorder', orderController.editOrder)
user_route.get('/order-place', orderController.orderplaced)


user_route.post('/verifyPayment',orderController.verifyOnlinePayment)
user_route.post('/checkout', orderController.placeOrder)
user_route.post('/order-place', orderController.orderplaced)

// WISHLIST CONTROLLER

user_route.get('/wishlist', auth.isLogin,wishlistController.getWishlist)
user_route.get('/wishlistitemdelete', auth.isLogin, wishlistController.removeProduct)


user_route.post('/addtowhishlist', auth.isLogin,wishlistController.addtowhishlist)
user_route.post('/whishToCart', auth.isLogin, wishlistController.addToCartFromWishlist)

user_route.post('/applyCoupon',couponController.applyCoupon)






module.exports = user_route
