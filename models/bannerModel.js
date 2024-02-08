const mongoose = require('mongoose');
const bannerSchema = new mongoose.Schema({
        image:{
            type:String,
            required:true
        },
        name:{
            type:String
        },
        status:{
            type:String,
            default:true
        }
})

const bannerModel = mongoose.model("banner",bannerSchema);
module.exports = bannerModel;