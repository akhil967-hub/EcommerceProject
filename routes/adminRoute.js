const express = require('express')
const admin_route = express()
const config = require('../config/config')
const session = require('express-session')
const auth = require('../middlewares/authAdmin')
const { upload, processImages } = require('../config/multerConfig');


const adminController = require('../controllers/adminController')
const productsController = require('../controllers/productController')
const categoryController = require('../controllers/categoryController')
const couponController = require('../controllers/couponsController')
const bannerController = require('../controllers/bannerController')



admin_route.set('view engine','ejs')
admin_route.set('views','./views/admin')

admin_route.use(session({
    secret:config.sessionSecret,
    saveUninitialized:true,
    resave:false,
    cookie:{maxAge : 9000000},
}))

const path = require('path')
const multer = require('multer')

const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../public/admin/productimages'))
    },
    filename:function(req,file,cb){
        const name = Date.now()+'-'+file.originalname
        cb(null,name)
    }
})

// const upload = multer({storage:storage})

admin_route.use(express.json())
admin_route.use(express.urlencoded({extended:true}))


// ADMIN CONTROLLER
admin_route.get('/',auth.isLogin,adminController.getAdminPanel)
admin_route.get('/login',auth.isLogout,adminController.getLogin)
admin_route.get('/logout',auth.isLogin,adminController.getLogout)
admin_route.get('/users',auth.isLogin,adminController.getUserManagement)
admin_route.get('/users/block',auth.isLogin,adminController.blockUser)
admin_route.get('/users/unblock',auth.isLogin,adminController.unBlockUser)
admin_route.get('/salesreport',auth.isLogin,adminController.getSalesReport)
admin_route.get('/salesreport/download',auth.isLogin,adminController.downloadSalesReport)
admin_route.get('/orders',auth.isLogin,adminController.getOrders)
admin_route.get('/orders/singleorder',auth.isLogin,adminController.getSingleOrder)
admin_route.get('/editorder',adminController.editOrder)

admin_route.post('/daily-report',auth.isLogin,adminController.dailySales);
admin_route.get('/dailysales/download',auth.isLogin,adminController.dailyDownload);
admin_route.post('/monthly-report',auth.isLogin,adminController.monthlysales)
admin_route.get('/monthlysales/download',adminController.monthlyDownload);
admin_route.post('/yearly-report',auth.isLogin,adminController.yearlysales);
admin_route.get('/yearlysales/download',adminController.yearlydownload)

admin_route.post('/login',adminController.postLogin)




// CATEGORY CONTROLLER
admin_route.get('/category',auth.isLogin,categoryController.getCategory)
admin_route.get('/category/add',auth.isLogin,categoryController.getAddCategoryPage)
admin_route.get('/category/block',auth.isLogin,categoryController.blockCategory)
admin_route.get('/category/unblock',auth.isLogin,categoryController.unBlockCategory)
admin_route.get('/category/edit',auth.isLogin,categoryController.editCategory)

admin_route.post('/category/add',categoryController.addCategory)
admin_route.post('/post-edit-category',categoryController. postEditCategory);


// PRODUCT CONTROLLER
admin_route.get('/products',auth.isLogin,productsController.getProducts)
admin_route.get('/products/add',auth.isLogin,productsController.getAddProducts)
admin_route.get('/products/delete',auth.isLogin,productsController.deleteProduct)
admin_route.get('/products/edit',auth.isLogin,productsController.editProduct) 
admin_route.get('/api/product/:productId/:imageIndex',productsController.productImage)

admin_route.post('/products/add',upload, processImages, productsController.addProduct)
admin_route.post('/products/edit',upload.array('image'),productsController.postEditProduct)
admin_route.post('/delete_image',productsController.deleteImage)


// COUPON CONTROLLER
admin_route.get('/coupons',couponController.getCouponListPage)
admin_route.get('/coupons/add',couponController.getCouponAddPage)
admin_route.get('/coupons/delete',couponController.deleteCoupon)
admin_route.get('/coupons/edit',couponController.editCoupon)

admin_route.post('/coupons/add',couponController.postAddCoupon)
admin_route.post('/coupons/edit',couponController.postEditCoupon)


// BANNER CONTROLLER
admin_route.get('/banners',bannerController.getBannerPage)
admin_route.get('/banners/add',bannerController.getBannerAddPage)
admin_route.get('/banners/statuschange',bannerController.statusChange)
admin_route.post('/banners/add',upload.single('image'),bannerController.addBanner)



module.exports = admin_route