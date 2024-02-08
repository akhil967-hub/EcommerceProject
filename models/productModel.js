const mongoose = require('mongoose')

const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true   
    },
    author: {
        type: String,
        required: false,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min:0 
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: Array,
        required: true
    },
    stock: {
        type: Number,
        required: true,
        min:0   
    },
    
    status:{
        type:String,
        required:true,
        trim: true
    }
})

module.exports = mongoose.model('products', productSchema)