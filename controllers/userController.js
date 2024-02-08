const users = require('../models/userModel')
const address = require('../models/addressModel')
const products = require('../models/productModel')
const category = require('../models/categoryModel')
const CategoryModel = require('../models/categoryModel')
const banners  = require('../models/bannerModel')
const orders = require('../models/orderModel')
const argon2= require('argon2')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer');
const session = require('express-session');
const config = require('../config/config')
// camel case is not followe bcoz to create a camelcase randomString below in fn
const randomstring = require('randomstring')

let dontenv = require('dotenv')
dontenv.config()

// set as a global variable to store the email of the user trying to register and verify email
// inorder to use that in another function rather than the function in which it is accessible in req.body.email object
let registerTimeEmail;
let registerTimeName;
let otp;




// function to be called inorder tobcrypt password
// --------------------------------------------------------------
const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash
    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");  

    }
}
// --------------------------------------------------------------



// function to be called TO SEND MAIL - to verify user mail
// --------------------------------------------------------------
sendVerifyMail = async (name, email, otp) => {
    registerTimeEmail = email;
    registerTimeName = name;
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.myEmail,
                pass: process.env.myEmailPassword
            }
        })

        const mailOptions = {
            from: config.myEmail,
            to: email,
            subject: 'For mail verification',
            html: `Hi ${name}, OTP for verifying your email is ${otp}`
        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error)
            } else {
                console.log('Mail has been sent succesfully', info.response)
            }

        })
    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");  

    }
}
// --------------------------------------------------------------



// function to be called TO SEND MAIL - to reset user password
// --------------------------------------------------------------
sendForgetPasswordMail = async (name, email, token) => {
    registerTimeEmail = email;
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: config.myEmail,
                pass: config.myEmailPassword
            }
        })

        const mailOptions = {
            from: config.myEmail,
            to: email,
            subject: 'For mail verification',
            html: `Hi ${name}, <a href="http://localhost:3000/reset-password?token=${token}"> Click here </a> to reset your password`

        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error.message)
            } else {
                console.log('Mail has been sent succesfully', info.response)
            }

        })
    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");  

    }
}
// --------------------------------------------------------------



// To load /home ie is '/'
// --------------------------------------------------------------
const getHome = async function (req, res) {
    const session = req.session.user_id
    const userData = await users.findOne({ _id: session })
    const productData = await products.find().limit(8)
    const bannerData = await banners.find({ status: 'true' })

    try {
        if (session) {
            res.render('home', { userData, session, productData, bannerData, active: 'home'});
        }
        else {
            res.render('home', { userData, session, productData, bannerData, active: 'home' })
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");  

    }
}
// --------------------------------------------------------------



// To load  /login
// --------------------------------------------------------------
const getLogin = async function (req, res) {
    try {
        res.render('login', {active:"home"})
    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");  

    }
}
// --------------------------------------------------------------




// To load /register
// --------------------------------------------------------------
const getRegister = async function (req, res) {
    try {
        res.render('register', {active:"home"})
    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");  

    }
}
// --------------------------------------------------------------




// POST register - & update data to db  & fun to send verification mail is called from here & redirected to otp enetering page
// --------------------------------------------------------------
const postRegister = async (req, res) => {
    try {

        const emailExists = await users.findOne({ email: req.body.email })

        if (emailExists) {
            res.render('register', { message: 'Email ID already registered',active:"home" })
        }
        else {

            if (req.body.password == req.body.confirmPassword) {
                const password = req.body.password.trim()
                const bcryptedPassword = await securePassword(password)
                const userData = new users({
                    name: req.body.name,
                    email: req.body.email,
                    mobile: req.body.mobile,
                    password: bcryptedPassword,
                    is_admin: 0,
                    is_verified: 0,
                    is_block: 0
                })
                const userDoc = await userData.save()
                if (userDoc) {
                    var randomNumber = Math.floor(Math.random() * 9000) + 1000;
                    otp = randomNumber
                    sendVerifyMail(req.body.name, req.body.email, otp)
                    res.redirect('/otp-page')
                }
                else {
                    res.render('register', { message: "Registration Failed",active:"home" })
                }
            }
            else {
                res.render('register', { message: 'Passwords doesnt match', active:"home" })
            }
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");  

    }
}
// --------------------------------------------------------------



// POST LOGIN - To verify the login credentials and if yes redirect to home
// --------------------------------------------------------------
const postLogin = async (req, res) => {
    try {
        const {email, password} = req.body
        const userDb = await users.findOne({email});

        if (userDb) {
            if (userDb.is_verified === 1 && userDb.is_block === 0) {
                let passwordMatch = false;

                if (userDb.password.startsWith('$argon2')) {
                    // Password hashed using argon2
                    passwordMatch = await argon2.verify(userDb.password, password);
                } else {
                    // Password hashed using bcrypt
                    passwordMatch = await bcrypt.compare(password, userDb.password);
                }

                if (passwordMatch) {
                    // const user_id = await userDb._id;
                    req.session.user_id = userDb.id;
                    res.redirect('/');
                } else {
                    res.render('login', { message: 'Incorrect password', active:"home" });
                }
            } else {
                res.render('login', { message: 'Your account is either blocked or not verified', active:"home" });
            }
        } else {
            res.render('login', { message: 'Incorrect email', active:"home" });
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");  

    }
};
// --------------------------------------------------------------



// TO LOGOUT A USER
// --------------------------------------------------------------
const userLogout = async (req, res) => {
    try {
        req.session.destroy()
        res.redirect('/')
    } catch (error) {
        console.log(error.mesage);
        return res.status(500).send("Internal Server Error");  

    }
}
// --------------------------------------------------------------




// TO get OTP ENTERING PAGE 
// --------------------------------------------------------------
const getOtpPage = async (req, res) => {
    try {
        res.render('otp-page', {active:"home"})
    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");  

    }
}
// --------------------------------------------------------------



// POST OTP PAGE ---------- Verifying user entered OTP and updating is_verified:1 
// --------------------------------------------------------------
const verifyOtp = async (req, res) => {
    try {
        let userotp = req.body.otp
        
        if (userotp == otp) {
            const updateInfo = await users.updateOne({ email: registerTimeEmail }, { $set: { is_verified: 1 } })
            console.log(updateInfo);
            res.redirect('/login')
        }
        else {
            res.render('otp-page', { message: 'Entered OTP is wrong', active:"home" })
        }

    } catch (error) {
        console.log(error.mesage)
        return res.status(500).send("Internal Server Error");  

    }
}
// --------------------------------------------------------------



const getProductPage = async (req, res) => {
    try {
        const session = req.session.user_id
        const userData = await users.findOne({ _id: session })
        const id = req.query.id
        const product = await products.findOne({ _id: id })
        if (session) {
            res.render('product', { userData, session, product, active:'shop' });
        }
        else {
            res.render('product', { userData, session, product, active:'shop'})
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");  

    }
}
// --------------------------------------------------------------


// SENDING OTP 2nd TIMe after timer out
// --------------------------------------------------------------
const resendOtp = async (req, res) => {
    try {
        randomNumber = Math.floor(Math.random() * 9000) + 1000;
        otp = randomNumber
        sendVerifyMail(registerTimeName, registerTimeEmail, otp)
        res.redirect('otp-page')

    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");  

    }


}
// --------------------------------------------------------------


// get profile
// --------------------------------------------------------------
const getProfile = async (req, res) => {
    try {
        const id = req.session.user_id
        const userData = await users.findById({ _id: id })
        const addressData = await address.findOne({ user: id })

        res.render('profile', {session:id, userData, addressData, active:"home" })

    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");  

    }
}

const editProfile = async (req, res) => {
    try {
        const id = req.session.user_id
        const userData = await users.findById({ _id: id })
   
      if (userData) {
        res.render('edit', { userData, active:"home"});
      } else {
        res.redirect('/profile');
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  const updateProfile = async (req, res) => {
    try {
      const id = req.session.user_id;
      const { name, mobile} = req.body;
  
      // Update user data
      await users.findByIdAndUpdate(id, { name, mobile});

  
      // Redirect to the profile page after updating
      res.redirect('/profile');
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Internal Server Error');
    }
  };
// --------------------------------------------------------------



// To view all ORDERS from Profile
// --------------------------------------------------------------
const getShopPage = async (req, res) => {
    try {
        
        const session = req?.session?.user_id;
        let userData;
        if (session) {
            userData = await users.findById({ _id: session });
        }

        var page = 1;
        if (req.query.page) {
            page = parseInt(req.query.page); // Parse the page parameter to an integer
        }
        const limit = 6;

        let price = req?.query?.value;
        let Category = req?.query?.category || "All";
        let Search = req?.query?.search || "";
        Search = Search.trim();

        const categoryData = await category.find({ is_block: false }, { name: 1, _id: 0 });
        let cat = [];
        for (let i = 0; i < categoryData.length; i++) {
            cat[i] = categoryData[i].name;
        }

        let sort;
        Category === "All" ? (Category = [...cat]) : (Category = req.query.category.split(','));
        price === "High" ? (sort = -1) : (sort = 1);

        const productData = await products.aggregate([
            { $match: { name: { $regex: new RegExp(Search, 'i') }, category: { $in: Category } } },
            { $sort: { price: sort } },
            { $skip: (page - 1) * limit },
            { $limit: limit }
        ]).exec();
        

        // Calculate total count of products that match the aggregation criteria
        const totalCount = await products.countDocuments({ name: { $regex: new RegExp(Search, 'i') }, category: { $in: Category } });

        const totalPages = Math.ceil(totalCount / limit);

        const categories = await CategoryModel.find();
        const activeCategory = req.query.category || ''; 


        res.render('shop', {
            session,
            userData,
            categoryData,
            productData,
            price,
            Category,
            Search,
            totalPages,
            currentPage: page,
            categories,
            activeCategory,
            active: 'shop'
        });
    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");  

    }
};

// --------------------------------------------------------------

const getMyOrders = async (req, res) => {
    try {
        const userid = req.session.user_id
        const orderData = await orders.find({ userId: userid }).populate('product.productId');
        console.log(orderData);
        
        res.render('my-orders', { message: orderData, active:"home" })


    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");  

        
    }
}

const getSingleOrderView = async (req, res) => {
    try {
        const userData = await users.findOne({ _id: req.session.user_id })
        const id = req.query.id
        const session = req.session.user_id
        const orderData = await orders.findById(id).populate("product.productId")
        console.log(orderData);

       
        const product = orderData.product
       
        res.render('single-orderview', { product, orderData, session, userData, active:"cart" })
    } catch (error) {
        console.log(error.message);
    }
}

// Load wallet history page
const loadwallet = async (req, res) => {
    try {
        // Fetch the user's wallet transactions
        const userId = req.session.user_id;
        const wallets = await walletTransaction.find({ userId: userId });
        console.log(wallets);

        // Render the wallet page with user data and wallet transactions
        res.render('wallet', { user: req.session.user, wallets, active:"home" });
    } catch (error) {
        console.error('Error fetching wallet transactions:', error);
        res.status(500).send('Internal Server Error');
    }
};




module.exports = {
    getHome,
    getLogin,
    getRegister,
    postRegister,
    postLogin,
    userLogout,
    getOtpPage,
    verifyOtp,
    getProductPage,
    resendOtp,
    getProfile,
    editProfile,
    updateProfile,
    getShopPage,
    getMyOrders,
    getSingleOrderView,
    loadwallet
}









