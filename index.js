const dotenv = require('dotenv');
dotenv.config();
const morgan = require('morgan')
const path = require('path')

const mongoose = require('mongoose')
 mongoose.connect('mongodb://127.0.0.1:27017/folder')


// const path = require('path')

const express = require('express')
const app = express()


app.use(morgan('dev'));

app.set('view engine', 'ejs'); // Set the view engine to EJS


app.use(express.static('public/users'))
app.use(express.static('public/admin'))

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// app.use(express.static(path.join(__dirname,"public")))

const userRoute = require('./routes/userRoute')
app.use('/',userRoute)

const adminRoute = require('./routes/adminRoute')
app.use('/admin',adminRoute)




// Mount the routes
app.use('/api/coupon', userRoute);
 
    app.use((req, res, next) => {
        res.status(404).render('404'); // Render the 404.ejs page
    });




app.listen(3000,()=>console.log("server started running  http://localhost:3000"))