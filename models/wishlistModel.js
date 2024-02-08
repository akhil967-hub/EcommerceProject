const mongoose=require('mongoose')
const whishListSchema=new mongoose.Schema({
    user:{
        type:String,
        ref:'user',
        required:true
    },
    product:[{
        productId:{
            type:String,
            ref:'products',
            required:true
        },
        name:{
            type:String
        },
        price:{
            type:Number
        }
    }]
})
module.exports=mongoose.model('whishList',whishListSchema)