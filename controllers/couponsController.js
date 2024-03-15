const session = require('express-session');
const coupon = require("../models/couponModel")

// To load  coupon view page
// --------------------------------------------------------------
const getCouponListPage = async function (req, res) {
    try {
        const couponData = await coupon.find({})
        res.render('coupons', { message: couponData, active: "coupons" })
    } catch (error) {
        console.log(error);
        return res.status(500).render('admin500');

    }
}
// --------------------------------------------------------------


// To load  add coupon form
// --------------------------------------------------------------
const getCouponAddPage = async function (req, res) {
    try {
        categoryData = []
        const yourValidationErrorValue = true;
        res.render('add-coupons', { validationError: yourValidationErrorValue, categoryData, active: "coupons" })
    } catch (error) {
        console.log(error);
        return res.status(500).render('admin500');

    }
}
// --------------------------------------------------------------


// To post added coupon to database
// --------------------------------------------------------------
// const postAddCoupon = async function (req, res) {
//     try {
//         const newCoupon = new coupon({
//             code: req.body.code,
//             discountType: req.body.discountType,
//             discountAmount: req.body.discountAmount,
//             maxDiscountAmount: req.body.amount,
//             maxCartAmount: req.body.cartamount,
//             expiryDate: req.body.expirydate,
//             maxUsers: req.body.couponcount
//         })
//         const couponData = await newCoupon.save()

//         if (couponData) {
//             res.redirect('/admin/coupons')
//         } else {
//             res.redirect('/admin')
//         }
//     } catch (error) {
//         console.log(error);
//         return res.status(500).render('admin500');

//     }
// }

const postAddCoupon = async function (req, res) {
    try {
        // Check if the coupon code already exists
        const existingCoupon = await coupon.findOne({ code: req.body.code.trim() });

        if (existingCoupon) {
            return res.status(400).render('add-coupons', { existingCoupon, categoryData, active: "coupons" });
        }

        // Client-side validation: Ensure required fields are not empty
        if (!req.body.code || !req.body.discountType || !req.body.discountAmount || !req.body.cartamount || !req.body.expirydate || !req.body.couponcount) {
            return res.status(400).send("All fields are required. Please fill in all the details");
        }

        const newCoupon = new coupon({
            code: req.body.code,
            discountType: req.body.discountType,
            discountAmount: req.body.discountAmount,
            maxDiscountAmount: req.body.amount,
            maxCartAmount: req.body.cartamount,
            expiryDate: req.body.expirydate,
            maxUsers: req.body.couponcount
        });

        const couponData = await newCoupon.save();

        if (couponData) {
            res.redirect('/admin/coupons');
        } else {
            res.redirect('/admin');
        }
    } catch (error) {
        console.log(error);
        return res.status(500).render('admin500');
    }
}

// --------------------------------------------------------------


// Post Apply coupon
// --------------------------------------------------------------
// const applyCoupon = async (req, res) => {
//     try {
//         const code = req.body.code;
//         const amount = Number(req.body.amount);
//         const userExist = await coupon.findOne({ code: code, user: { $in: [req.session.user_id] } });
//         if (userExist) {
//             res.json({ user: true });
//         } else {
//             const couponData = await coupon.findOne({ code: code });

//             if (couponData) {
//                 if (couponData.maxUsers <= 0) {
//                     res.json({ limit: true });
//                 } else {
//                     if (couponData.status == false) {
//                         res.json({ status: true })
//                     } else {
//                         if (couponData.expiryDate <= new Date()) {
//                             res.json({ date: true });
//                         } else {
//                             if (couponData.maxCartAmount >= amount) {
//                                 res.json({ cartAmount: true });
//                             } else {
//                                 await coupon.findByIdAndUpdate({ _id: couponData._id }, { $push: { user: req.session.user_id } });
//                                 await coupon.findByIdAndUpdate({ _id: couponData._id }, { $inc: { maxUsers: -1 } });
//                                 if (couponData.discountType == "Fixed") {
//                                     const disAmount = couponData.discountAmount;

//                                     const disTotal = Math.round(amount - disAmount);
//                                     return res.json({ amountOkey: true, disAmount, disTotal });

//                                 } else if (couponData.discountType == "Percentage Type") {


//                                     const perAmount = (amount * couponData.discountAmount) / 100;

//                                     const discountAmount = (amount * couponData.maxDiscountAmount) / 100;

//                                     if (perAmount <= discountAmount) {

//                                         const disAmount = perAmount;
//                                         const disTotal = Math.round(amount - disAmount);
//                                         return res.json({ amountOkey: true, disAmount, disTotal });
//                                     }


//                                 } else {
//                                     const disAmount = discountAmount;
//                                     const disTotal = Math.round(amount - disAmount);
//                                     return res.json({ amountOkey: true, disAmount, disTotal });
//                                 }
//                             }
//                         }
//                     }
//                 }
//             } else {
//                 res.json({ invalid: true });
//             }
//         }

//     } catch (error) {
//         console.log(error.message);
//         return res.status(500).render('users500');

//     }
// }
// --------------------------------------------------------------

const applyCoupon = async (req, res) => {
    try {
        const code = req.body.code;
        const amount = Number(req.body.amount);
        const userId = req.session.user_id;
        let discAmount= 0;
        
        const couponData = await coupon.findOne({ code: code });

        if (couponData) {
            const userUsedCoupon = couponData.user.includes(userId);

            if (!userUsedCoupon) {
                await coupon.findOneAndUpdate({ _id: couponData._id }, { $push: { user: userId } });
            }

            if (couponData.maxUsers <= 0) {
                return res.json({ limit: true });
            }
            if (couponData.status == false) {
                return res.json({ status: true });
            }
            if (couponData.expiryDate <= new Date()) {
                return res.json({ date: true });
            }
            if (couponData.maxCartAmount >= amount) {
                return res.json({ cartAmount: true });
            } else {
                await coupon.findByIdAndUpdate({ _id: couponData._id }, { $push: { user: req.session.user_id } });
                await coupon.findByIdAndUpdate({ _id: couponData._id }, { $inc: { maxUsers: -1 } });

                 if (couponData.discountType == "percentage") {
                    const perAmount = (amount * couponData.discountAmount) / 100;
                    // const discountAmount = (amount * couponData.maxDiscountAmount) / 100;

                    if (perAmount > couponData?.maxDiscountAmount) {
                        discAmount= couponData.maxDiscountAmount;
                    } else {
                        discAmount= perAmount;
                    }

                } else if (couponData.discountType == "fixed") {
                    discAmount= couponData.discountAmount
                }
                const disTotal = Math.round(amount - discAmount);
                console.log(discAmount,"yy");
                console.log(disTotal,"hh");

                return res.json({ amountOkey: true, discAmount, disTotal });
                
            }
        } else {
            res.json({ invalid: true });
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).render('users500');
    }
}

const removeCoupon = async (req, res) => {
   
    try {
        const code = req.body.code;
        const userId = req.session.user_id;
        console.log(code, "code");

        const couponData = await coupon.findOne({ code: code });
        console.log(userId,"1");
        console.log(couponData,"2");

        if (couponData && couponData.user.includes(userId)) {
            await coupon.findByIdAndUpdate({ _id: couponData._id }, { $pull: { user: userId } });
            await coupon.findByIdAndUpdate({ _id: couponData._id }, { $inc: { maxUsers: 1 } });
            console.log(userId);
            console.log(couponData._id);
            return res.json({ success: true });
        } else {
            return res.json({ error: "Coupon not found or not applied" });
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).render('users500');
    }
}



// Delete coupon
// --------------------------------------------------------------
const deleteCoupon = async function (req, res) {
    try {
        const id = req.query.id
        await coupon.deleteOne({ _id: id })
        res.redirect("/admin/coupons")
    } catch (error) {
        console.log(error);
        return res.status(500).render('admin500');

    }
}
// --------------------------------------------------------------


// Edit coupon
// --------------------------------------------------------------
const editCoupon = async function (req, res) {
    try {
        const id = req.query.id
        const couponData = await coupon.findById({ _id: id })
        console.log(couponData);
        res.render("edit-coupon", { couponData, active: "coupons" })
    } catch (error) {
        console.log(error);
        return res.status(500).render('admin500');

    }
}
// --------------------------------------------------------------\


// post Edit Coupon
// --------------------------------------------------------------
// const postEditCoupon = async function (req, res) {
//     try {
//         const id = req.body.id
//         await coupon.updateMany({_id:id},{$set:{
//             code: req.body.code,
//             discountType: req.body.discountType,
//             discountAmount: req.body.discountAmount,
//             maxDiscountAmount: req.body.amount,
//             maxCartAmount: req.body.cartamount,
//             expiryDate: req.body.expirydate,
//             maxUsers: req.body.couponcount
//         }})

//         res.redirect("/admin/coupons")
//     } catch (error) {
//         console.log(error);
//         return res.status(500).render('admin500');

//     }
// }
const postEditCoupon = async function (req, res) {
    try {
        const id = req.body.id;
        //const existingCoupon = await coupon.findById(id);

        // Check if the coupon code already exists
        // const existingCoupon = await coupon.findOne({ code: req.body.code.trim() });

        // if (existingCoupon) {
        //     res.locals.errorMessage = `Coupon code "${existingCoupon.code}" already exists. Please choose a different code.`;
        //     console.log("Error Message:", res.locals.errorMessage);

        //     return res.render('edit-coupon', { couponData:existingCoupon, active: "coupons" });
        // }

        // Client-side validation: Ensure required fields are not empty
        if (!req.body.code || !req.body.discountType || !req.body.discountAmount || !req.body.amount || !req.body.cartamount || !req.body.expirydate || !req.body.couponcount) {
            return res.status(400).send("All fields are required. Please fill in all the details.");
        }

        await coupon.updateMany({ _id: id }, {
            $set: {
                code: req.body.code,
                discountType: req.body.discountType,
                discountAmount: req.body.discountAmount,
                maxDiscountAmount: req.body.amount,
                maxCartAmount: req.body.cartamount,
                expiryDate: req.body.expirydate,
                maxUsers: req.body.couponcount
            }

        });


        res.redirect("/admin/coupons");
    } catch (error) {
        console.log(error);
        return res.status(500).render('admin500');
    }
}

// --------------------------------------------------------------


module.exports = {
    getCouponListPage,
    getCouponAddPage,
    postAddCoupon,
    applyCoupon,
    removeCoupon,
    deleteCoupon,
    editCoupon,
    postEditCoupon
}