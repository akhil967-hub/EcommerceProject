const mongoose = require('mongoose')
const {ObjectId} = require('mongodb')

const cartSchema = mongoose.Schema({
    userId:{
        type:ObjectId,
        ref:"users",
        required:true
    },
    userName:{
        type:String,
        required:true
    },
    products:[{
        productId:{
            type:ObjectId,
            ref:"products",
            required:true
        },
        count:{
            type:Number,
            default:1
        },
        productPrice:{
            type:Number,
            required:true
        },
        totalPrice:{
            type:Number,
            default:0
        }
    }]
})

module.exports = mongoose.model('carts', cartSchema)