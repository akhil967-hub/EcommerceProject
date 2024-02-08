const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    deliveryDetails: {
        type: String,
        required: true,
    },
    user: { type: String },
    userId: { type: String },
    paymentMethod: { type: String },

    product: [{
        productId: {
            type: mongoose.Types.ObjectId,
            ref: "products",
            required: true
        },
        count: {
            type: Number,
            required: true
        },
    }],
    paid: { type: Number },
    wallet: { type: Number },
    totalAmount: { type: Number },
    date: { type: Date },
    status: { type: String },
    paymentId: { type: String },
},
    { timestamps: true }
);

module.exports = mongoose.model("order", orderSchema)