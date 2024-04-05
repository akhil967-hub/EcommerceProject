const session = require('express-session')
const users = require('../models/userModel')
const product = require('../models/productModel')
const cart = require('../models/cartModel')
const address = require('../models/addressModel')
const addressModel = require('../models/addressModel')



// Add user clicked product to his cart db, if new create a new cart db for user and store
// ---------------------------------------------------------------------------------
const addToCart = async (req, res) => {
    try {
        const productId = req.body.id;
        const productData = await product.findById({ _id: productId });

        const productStock = productData.stock
        if (productStock < 1) {
            return res.status(400).json({ success: false, message: 'Out of stock, keep it added in wishlist' });
        } else {

            if (req.session.user_id) {
                const userid = req.session.user_id;
                const userData = await users.findById({ _id: userid });
                const cartData = await cart.findOne({ userId: userid })

                if (cartData) {
                    const productExist = cartData.products.findIndex((product) => product.productId == productId)
                    if (productExist != -1) {
                        await cart.updateOne({ userId: userid, "products.productId": productId }, { $inc: { "products.$.count": 1 } });
                        res.json({ success: true });
                    } else {
                        await cart.findOneAndUpdate({ userId: req.session.user_id }, { $push: { products: { productId: productId, productPrice: productData.price } } })
                        res.json({ success: true });
                    }


                } else {
                    const Cart = new cart({
                        userId: userData._id,
                        userName: userData.name,
                        products: [{
                            productId: productId,
                            productPrice: productData.price
                        }]

                    });
                    const cartData = await Cart.save();
                    if (cartData) {
                        res.json({ success: true })
                    } else {
                        res.redirect('/home')
                    }
                }

            } else {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

        }


    } catch (error) {
        console.log(error.message);
        return res.status(500).render('users500');

        
    }

}
// ---------------------------------------------------------------------------------



// Load CART
// ---------------------------------------------------------------------------------
const getCart = async (req, res) => {
    try {
        const session = req.session.user_id;

        const userData = await users.findOne({ _id: session });
        const cartData = await cart.findOne({ userId: session }).populate("products.productId");
       

        if (cartData) {

            if (cartData.products.length > 0) {
                const products = cartData.products;

                let Total = 0;
                let outOfStockProducts = [];
                for (let i = 0; i < products?.length; i++) {
                    
                    const product = products[i]?.productId;
                    console.log(products[i], "haai");
                    const productStock = product?.stock;
                    const cartQuantity = products[i]?.count;
                    
                    if (productStock >= cartQuantity) {
                        Total += products[i]?.productPrice * cartQuantity;
                    } else {
                        outOfStockProducts.push(product?._id);
                    }
                }
                console.log(Total);
                const userCartId = userData._id;

                res.render("cart", { userData, session, Total, userCartId, products, outOfStockProducts, active:'cart' });
            }
            else {

                res.render("cartEmpty", { session, userData, message: "No product added" , active:'cart'});
            }
        } else {

            res.render("cartEmpty", { session, userData, message: "No product added", active:'cart' });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).render('users500');


    }
};


// ---------------------------------------------------------------------------------


// To load  Checkout
// --------------------------------------------------------------
const getCheckout = async function (req, res) {
    try {
        const session = req.session.user_id
        const userData = await users.findById({ _id: session })
        let cartData = await cart.findOne({ userId: session }).populate("products.productId");
        const products = cartData.products;

        for (let i = 0; i < products.length; i++) {
            let product = products[i];
            let quantity = product.count;
            let stock = product.productId.stock;
            if (quantity > stock) {
                cartData.products.splice(i, 1);
            }
        }

        await cartData.save(); 
        const total = await cart.aggregate([{ $match: { userId: userData._id } }, { $unwind: "$products" }, { $project: { productPrice: "$products.productPrice", count: "$products.count" } }, { $group: { _id: null, total: { $sum: { $multiply: ["$productPrice", "$count"] } } } }]);
        const Total = total[0].total;

        const addressdata = await address.findOne({ user: session });
        res.render('checkout', { session, userData, addressdata, products: cartData.products, Total, active:'' });
    } catch (error) {
        console.log(error.message);
        return res.status(500).render('users500');

    }
}


// --------------------------------------------------------------



// To load  add address Table
// --------------------------------------------------------------
const getAddAddress = async function (req, res) {
    try {
        const session = req.session.user_id
        const userData = await users.findById({ _id: session })
        res.render('add-address', { userData, session, active:'' })
    } catch (error) {
        console.log(error.message);
        return res.status(500).render('users500');

    }
}
// --------------------------------------------------------------


// post  add address Table
// --------------------------------------------------------------
const postAddAddress = async function (req, res) {
    try {
        const user = req.session.user_id
        const userexist = await address.findOne({ user: user })
        if (userexist) {
            const user = req.session.user_id
            await address.updateOne({ user: user }, {
                $push: {
                    address: {
                        firstname: req.body.fname,
                        lastname: req.body.lname,
                        country: req.body.country,
                        state: req.body.state,
                        city: req.body.city,
                        address: req.body.address,
                        pin: req.body.pin,
                        phone: req.body.phone,
                        email: req.body.email
                    }
                }
            })
        }
        else {
            const Address = new address({
                user: req.session.user_id,
                address: [{
                    firstname: req.body.fname,
                    lastname: req.body.lname,
                    country: req.body.country,
                    state: req.body.state,
                    city: req.body.city,
                    address: req.body.address,
                    pin: req.body.pin,
                    phone: req.body.phone,
                    email: req.body.email

                }]
            })
            const addressdata2 = await Address.save()
        }
        res.redirect("/checkout")
    } catch (error) {

        console.log(error.message);
        return res.status(500).render('users500');


    }
}
// --------------------------------------------------------------

const getEditAddress = async (req, res) => {
    try {
      const userId = req.session.user_id;
      const addressIndex = req.query.index; // Extract index from the URL parameter
      const addressData = await address.findOne({ user: userId });
      const userData = await users.findById({ _id: userId })
       
  
      if (addressData && addressData.address.length > 0) {
        const editedAddress = addressData.address[addressIndex];
        res.render('edit-address', {session:userId, userData, editedAddress, index: addressIndex ,  active:""}); // Pass index to the template
      } else {
        res.redirect('/profile'); // Redirect to the profile page if no addresses are found
      }
    } catch (error) {
      console.log(error);
      res.redirect('/profile'); // Redirect to the profile page in case of an error
    }
  };
  
  const postEditAddress = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const addressIndex = req.query.index;
        const userAddress = await addressModel.findOne({ user: userId });
        const { state, city, address, pin, country } = req.body;
        console.log(req.body);

        // Log the user ID to verify it is correct
        console.log('UserID:', userId);

        // Find the user's address data using the model directly

        // Log the userAddress to see if it is fetched correctly
        console.log('User Address:', userAddress);

        if (userAddress && userAddress.address.length > 0) {
            // Update the specific address at the given index
            userAddress.address[addressIndex].state = state;
            userAddress.address[addressIndex].city = city;
            userAddress.address[addressIndex].address = address;
            userAddress.address[addressIndex].pin = pin;
            userAddress.address[addressIndex].country = country;

            // Save the updated user address data using the model directly
            await addressModel.findOneAndUpdate({ user: userId }, { address: userAddress.address });

            res.redirect('/profile');
        } else {
            res.redirect('/profile');
        }
    } catch (error) {
        console.error(error.message);
        res.redirect('/profile');
    }
};

const deleteAddress = async (req, res) => {
    try {
      const userId = req.session.user_id;
      const addressIndex = req.params.index; // Extract index from the URL parameter
      const addressData = await address.findOne({ user: userId });
  
      if (addressData && addressData.address.length > 0) {
        // Remove the address at the specified index
        addressData.address.splice(addressIndex, 1);
        await addressData.save();
  
        res.redirect('/profile'); // Redirect to the profile page after deletion
      } else {
        res.redirect('/profile'); // Redirect to the profile page if no addresses are found
      }
    } catch (error) {
      console.log(error);
      res.redirect('/profile'); // Redirect to the profile page in case of an error
    }
  };

// Remove product from cart
// --------------------------------------------------------------
const removeProduct = async function (req, res) {
    try {
        const productid = req.query.id
        const session = req.session.user_id
        await cart.findOneAndUpdate({ userId: session }, { $pull: { products: { productId: productid } } })
        res.redirect('/cart')

    } catch (error) {
        console.log(error.message);
        return res.status(500).render('users500');

    }
}
// --------------------------------------------------------------

// Remove product from cart
// --------------------------------------------------------------
const postremoveProduct = async function (req, res) {
    try {
        const productid = req.body.product
        const session = req.session.user_id
        await cart.findOneAndUpdate({ userId: session }, { $pull: { products: { productId: productid } } })
        res.json({ remove: true })

    } catch (error) {
        console.log(error.message);
        return res.status(500).render('users500');

    }
}
// --------------------------------------------------------------



// cartQuantityIncrese
// --------------------------------------------------------------
const cartQuantityIncrese = async (req, res, next) => {
    try {

        let cartId = req.body.cart;
        const proId = req.body.product;
        let quantity = parseInt(req.body.quantity)
        let count = parseInt(req.body.count)


        const Product = await product.findById({ _id: proId });

        const productStock = Product.stock;

        if (count === 1 && (quantity + 1) > productStock) {

            return res.status(400).json({ success: false, message: 'Stock limit will be exceeded' });
        }

        if ((count == -1) && (quantity == 1)) {
            res.json({ remove: true })
        } else {
            await cart.updateOne({ userId: req.session.user_id, "products.productId": proId }, { $inc: { "products.$.count": count } });
        }
        next();
    } catch (error) {
        console.log(error.message);
        return res.status(500).render('users500');

    }
}






const totalproductprice = async (req, res, proId) => {
    try {
        const userd = await users.findOne({ _id: req.session.user_id })
        let total = await cart.aggregate([
            {
                $match: {
                    userId: userd._id,
                },
            },
            {
                $unwind: "$products",
            },
            {
                $project: {
                    price: "$products.productPrice",
                    quantity: "$products.count",
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: { $multiply: ["$price", "$quantity"] } },
                },
            },
        ]);
        let Total = total[0].total;
        res.json({ success: true, Total });
    } catch (error) {
        console.log(error.message);
        return res.status(500).render('users500');

    }
};
// --------------------------------------------------------------







module.exports = {
    addToCart,
    getCart,
    getCheckout,
    getAddAddress,
    postAddAddress,
    getEditAddress,
    postEditAddress,
    deleteAddress,
    removeProduct,
    cartQuantityIncrese,
    totalproductprice,
    postremoveProduct,

}