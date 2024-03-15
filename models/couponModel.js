const mongoose = require('mongoose');
const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true
        
    },
    discountType: {
        type: String,
        required: true,
        enum: ['percentage', 'fixed'], 
        default: 'fixed' 
    },
    
    discountAmount: {
        type: Number,
        required: true
    },
    maxCartAmount: {
        type: Number,
        required: true
    },
    maxDiscountAmount: {
        type: Number
    },
    user: {
        type: Array,
        ref: "users",
        default: []
    },
    maxUsers: {
        type: Number
    },
    status: {
        type: Boolean,
        default: true
    },
    expiryDate: {
        type: Date,
        required: true
    }
})

const couponModel = mongoose.model("coupon", couponSchema);
module.exports = couponModel;