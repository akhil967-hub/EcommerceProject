const dotenv = require('dotenv');
dotenv.config();
const morgan = require('morgan')

const mongoose = require('mongoose')
 mongoose.connect('mongodb://127.0.0.1:27017/folder')


// const path = require('path')

const express = require('express')
const app = express()


app.use(morgan('dev'));


app.use(express.static('public/users'))
app.use(express.static('public/admin'))

// app.use(express.static(path.join(__dirname,"public")))

 
const userRoute = require('./routes/userRoute')
app.use('/',userRoute)

const adminRoute = require('./routes/adminRoute')
app.use('/admin',adminRoute)


app.listen(3000,()=>console.log("server started running  http://localhost:3000"))