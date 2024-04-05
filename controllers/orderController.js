const { createRequire } = require('module')
const { log } = require('console')
const session = require('express-session')

const User = require('../models/userModel')
const order = require('../models/orderModel');
const cart = require('../models/cartModel');
const productModel = require('../models/productModel');
const walletTransactionCollection = require('../models/walletTransactionModel');
const Razorpay = require('razorpay')
const puppeteer = require('puppeteer')



let dontenv = require('dotenv')
dontenv.config()

var instance = new Razorpay({
    key_id: process.env.razorpayId,
    key_secret: process.env.razorpayKey
});


const { ObjectId } = require('mongoose').Types;

async function recordWalletTransaction(userId, transactionType, amount, description) {
    try {
      const transaction = new walletTransactionCollection({
        userId,
        transactionType,
        amount,
        description,
      });
  
      await transaction.save();
      console.log('Wallet transaction recorded successfully.');
    } catch (error) {
      console.error('Error recording wallet transaction:', error);
    }
  }


//place the order
// ----------------------------------
const placeOrder = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.session.user_id });
        const session = req.session.user_id

        const cartData = await cart.findOne({ userId: req.session.user_id });
        const products = cartData.products;
        
        let flag = 0
        for (let i = 0; i < products.length; i++) {
            const productId = products[i].productId
            const quantity = products[i].count
            const productData = await productModel.findById({_id: productId})
            const stock = productData.stock
            if(stock < quantity){
                flag = 1
            }
        }
        
        if(flag == 0){
        const total = await cart.aggregate([{ $match: { userId: userData._id } }, 
            { $unwind: "$products" }, { $project: { productPrice: "$products.productPrice", count: "$products.count" } }, 
            { $group: { _id: null, total: { $sum: { $multiply: ["$productPrice", "$count"] } } } }]);
        // let Total = req.body.amount

        let discountAmount = req.body.discountAmount
        

        const TotalInitially = total.length > 0 ? total[0].total : 0;
        const Total = TotalInitially - discountAmount

        const userWalletAmount = userData.wallet
        

        let paidAmount;
        let walletAmountUsed
        let walletAmountBalance

        if (userWalletAmount < Total) {
            paidAmount = req.body.amount
            walletAmountUsed = TotalInitially - paidAmount - discountAmount
            walletAmountBalance = userWalletAmount - walletAmountUsed
        } else {
            paidAmount = 0
            walletAmountUsed = Total
            walletAmountBalance = userWalletAmount - Total
        }

        await User.findOneAndUpdate({ _id: req.session.user_id }, { $set: { wallet: walletAmountBalance } })

        const userId = req.session.user_id;
        const transactionType = 'debit';
        const transactionAmount = walletAmountUsed;
        const transactionDescription = 'Order payment';
        await recordWalletTransaction(userId, transactionType, transactionAmount, transactionDescription);

        let payment = req.body.payment;
        let address = req.body.address

        if (payment === undefined) {
            payment = 'wallet'
        }


        //const cartData = await cart.findOne({ userId: req.session.user_id });

        //const products = cartData.products;
        console.log(products);

        let status

        if (payment != "online") {
            status = "placed"
        } else {
            status = "pending"
        }
        // const status = payment === "COD" ? "placed" : "pending";

        const newOrder = new order({
            deliveryDetails: address,
            user: userData.name,
            userId: userData._id,
            paymentMethod: payment,
            paid: paidAmount,
            wallet: walletAmountUsed,
            product: products,
            totalAmount: Total,
            date: Date.now(),
            status: status
        });

        const saveOrder = await newOrder.save();
        const orderId = newOrder._id;
    
        // to reduce the stock
        const orderData = await order.findById({ _id: orderId })
        const product = orderData.product
        for (let i = 0; i < product.length; i++) {
            const productId = product[i].productId
            const quantity = product[i].count
            await productModel.findByIdAndUpdate(productId, { $inc: { stock: -quantity } })
            const productData = await productModel.findById({_id: productId})
            if(productData.stock === 0){
                await productModel.findByIdAndUpdate(productId, { $set: { status: 'Out Of Stock' } })
            }
        }
        // -----



        if (status === "placed") {
            await cart.deleteOne({ userId: userData._id });

            res.json({ success: true })

        } else {

            const orderid = saveOrder._id

            const totalamount = saveOrder.paid

            var options = {
                amount: totalamount*100 ,
                currency: "INR",
                receipt: "" + orderid
            }
            instance.orders.create(options, function (err, order) {
                res.json({ order });
            })
        }
       
    } else{
        res.status(404).json("Quantity not enough")
    }
    } catch (error) {
        console.log(error.message);
        return res.status(500).render('users500');

    }
}

// verify online payment
const verifyOnlinePayment = async (req, res) => {
    try {
        
        const details = (req.body)

        const crypto = require('crypto');
        let hmac = crypto.createHmac('sha256', process.env.razorpayKey);
        hmac.update(details.payment.razorpay_order_id + '|' + details.payment.razorpay_payment_id)

        hmac = hmac.digest('hex');


        console.log(details.payment.razorpay_signature);

        if (hmac == details.payment.razorpay_signature) {

            await order.findByIdAndUpdate({ _id: details.order.receipt }, { $set: { status: "placed" } });
            await order.findByIdAndUpdate({ _id: details.order.receipt }, { $set: { paymentId: details.payment.razorpay_payment_id } });
            await cart.deleteOne({ userId: req.session.user_id });
            res.json({ success: true });
        } else {
            await order.findByIdAndRemove({ _id: details.order.receipt });
            res.json({ success: false });
        }


    } catch (error) {
        console.log(error.message);
        return res.status(500).render('users500');


    }
}



// succes page
const orderplaced = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.session.user_id })
        const session = req.session.user_id

        res.render('success', { session, userData, active:'cart' })

    } catch (error) {
        console.log(error.message);
        return res.status(500).render('users500');


    }
}


// edit the status of order
const editOrder = async (req, res) => {
    try {
        const id = req.query.id
        const orderData = await order.findById({ _id: id })


        if (orderData.status === 'placed') {
            await order.updateOne({ _id: id }, { $set: { status: 'req-for-cancellation' } })
            res.redirect('/myorders')
        }

        if (orderData.status === 'delivered') {
            await order.updateOne({ _id: id }, { $set: { status: 'req-for-return' } })
            res.redirect('/myorders')
        }

    } catch (error) {
        console.log(error.message);
        return res.status(500).render('users500');

    }
}


//generate invoice for user side
// const generateInvoice = async (req, res) => {
//     try{
//         const  orderid = req?.params.orderid;
//         const orderData = await order.findById(orderid)
//             console.log(orderData,"ljhf");
//         const htmlContent = await invoiceHtml(orderData)
    
//         // Launch a headless browser using Puppeteer with the 'new' headless mode
//         const browser = await puppeteer.launch({ headless: 'new' });
//         const page = await browser.newPage();
//         // Set the HTML content of the page
//         await page.setContent(htmlContent);
        
//         // Generate a PDF file from the HTML content
//         const pdfBuffer = await page.pdf({
//              format: 'A4',
//              margin: {
//                 top: '30px',
//                 right: '30px',
//                 bottom: '30px',
//                 left: '30px',
//             },
//             });
//         await browser.close();
    
//         // Set the response headers for PDF download
//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
//         res.send(pdfBuffer);
//     }catch(error){
//         console.log(error.message);
//     }
// }



module.exports = {
    recordWalletTransaction,
     placeOrder, 
     editOrder, 
     orderplaced,
     verifyOnlinePayment,
    // generateInvoice
}