const users = require('../models/userModel')
const category = require('../models/categoryModel')
const productModel = require('../models/productModel')
const order = require('../models/orderModel')
const Order = require('../models/orderModel')
const session = require('express-session')
const bcrypt = require('bcrypt')
const { ClientSession } = require('mongodb')
const excel = require('exceljs');



const getAdminPanel = async (req, res) => {
    try {
        const total = await order.aggregate([
            {
                $match: {
                    status: { $nin: ["cancelled", "returned"] } // Exclude "cancelled" and "returned" statuses
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$paid" }
                }
            }
        ]);

        const user_count = await users.find({ is_admin: 0 }).count();
        const order_count = await order.find({}).count();
        const product_count = await productModel.find({}).count();

        const payment = await order.aggregate([{ $group: { _id: "$paymentMethod", totalPayment: { $count: {} } } }])

        let sales = [];
        var date = new Date();
        var year = date.getFullYear();
        var currentyear = new Date(year, 0, 1);
        let salesByYear = await order.aggregate([
            {
                $match: {
                    createdAt: { $gte: currentyear },
                    status: { $nin: ["cancelled", "returned"] } // Exclude "cancelled" and "returned" statuses
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%m", date: "$createdAt" } },
                    total: { $sum: "$paid" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        for (let i = 1; i <= 12; i++) {
            let result = true;
            for (let k = 0; k < salesByYear.length; k++) {
                result = false;
                if (salesByYear[k]._id == i) {
                    sales.push(salesByYear[k])
                    break;
                } else {
                    result = true
                }
            }
            if (result) sales.push({ _id: i, total: 0 });
        }
        let salesData = [];
        for (let i = 0; i < sales.length; i++) {
            salesData.push(sales[i].total);
        }
        console.log(salesData);

        res.render('admin-panel', { total, user_count, order_count, product_count, payment, month: salesData, active:"admin" })
    } catch (error) {
        console.log(error)
    }
}



// GET LOGIN  - get /admin/login
// ---------------------------------------------------------------------------------
const getLogin = async (req, res) => {
    try {

        res.render('login')
    } catch (error) {
        console.log(error.message)
        return res.status(500).send("Internal Server Error");  

    }
}
// ---------------------------------------------------------------------------------




// POST LOGIN    - To verify Admin credentials
// ---------------------------------------------------------------------------------
const postLogin = async (req, res) => {
    try {
        const emailEntered = req.body.email
        const passwordEntered = req.body.password
        const adminDb = await users.findOne({ email: emailEntered })

        if (adminDb) {
            const matchPassword = await bcrypt.compare(passwordEntered, adminDb.password)
            if (matchPassword) {
                if (adminDb.is_admin === 0) {
                    res.render('login', { message: 'You are not ADMIN' })
                }
                else {
                    req.session.admin = adminDb
                    res.redirect('/admin')
                }
            }
            else {
                res.render('login', { message: 'Entered password is wrong' })
            }
        }
        else {
            res.render('login', { message: 'Entered email ID is wrong' })
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");  

    }
}
// ---------------------------------------------------------------------------------



// GET LOGOUT - session destroy
// ---------------------------------------------------------------------------------
const getLogout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/admin/login'); // Redirect to the login page after logout
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};
// ---------------------------------------------------------------------------------




// GET USER MANAGEMENT - /admin/users
// ---------------------------------------------------------------------------------
const getUserManagement = async (req, res) => {
    try {
        const userDatas = await users.find({ $and: [{ is_verified: 1 }, { is_admin: 0 }] })
        res.render('users', { message: userDatas, active:"users" })
    } catch (error) {
        console.log(error.message)
        return res.status(500).send("Internal Server Error");  

    }
}
// ---------------------------------------------------------------------------------




// TO BLOCK USER - /admin/users/block
// ---------------------------------------------------------------------------------
const blockUser = async (req, res) => {
    try {
        const id = req.query.id
        await users.updateOne({ _id: id }, { $set: { is_block: 1 } })
        res.redirect('/admin/users')
    } catch (error) {
        console.log(error.message)
        return res.status(500).send("Internal Server Error");  

    }
}
// ---------------------------------------------------------------------------------




// TO un BLOCK USER - /admin/users/block
// ---------------------------------------------------------------------------------
const unBlockUser = async (req, res) => {
    try {
        const id = req.query.id
        await users.updateOne({ _id: id }, { $set: { is_block: 0 } })
        res.redirect('/admin/users')
    } catch (error) {
        console.log(error.message)
        return res.status(500).send("Internal Server Error");  

    }
}
// ---------------------------------------------------------------------------------




// get ORDERS
// ---------------------------------------------------------------------------------
const getOrders = async (req, res) => {
    try {
        const orders = await order.find({})
        res.render('order', { message: orders, active:"orders" })
    } catch (error) {
        console.log(error.message)
        return res.status(500).send("Internal Server Error");  

    }
}
// ---------------------------------------------------------------------------------

// get single ORDERS details
// ---------------------------------------------------------------------------------
const getSingleOrder = async (req, res) => {
    try {
       
        const id = req.query.id
        
        const orderData = await order.findById(id).populate("product.productId")
       
        const product = orderData.product
       
        res.render('singleorder', { product, orderData})
    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");  

    }
}
// ---------------------------------------------------------------------------------


// edit ORDERS
// ---------------------------------------------------------------------------------
const editOrder = async (req, res) => {
    try {
        const id = req.query.id
        const orderData = await order.findById({ _id: id })
        const totalBillAmount = orderData.totalAmount

        if (orderData.status === 'placed') {
            await order.updateOne({ _id: id }, { $set: { status: 'delivered' } })
            res.redirect('/admin/orders')
        }


        if (orderData.status === 'req-for-cancellation') {

            const walletAmountUsed = orderData.wallet
            const userid = req.session.user_id
            const userData = await users.findById({ _id: userid })

            const newWallet = parseInt(userData.wallet + walletAmountUsed)
            if (orderData.paymentMethod === 'COD') {
                await users.findByIdAndUpdate({ _id: userid }, { $set: { wallet: newWallet } })
            } else {
                await users.findByIdAndUpdate({ _id: userid }, { $set: { wallet: totalBillAmount } })
            }
            await order.updateOne({ _id: id }, { $set: { status: 'cancelled' } })

            // to increase the stock
            const product = orderData.product
            for (let i = 0; i < product.length; i++) {
                const productId = product[i].productId
                const productData = await productModel.findById({ _id: productId })
                if (productData.stock === 0) {
                    await productModel.findByIdAndUpdate(productId, { $set: { status: 'In Stock' } })
                }
                const quantity = product[i].count
                await productModel.findByIdAndUpdate(productId, { $inc: { stock: +quantity } })
            }
            // -----

            res.redirect('/admin/orders')
        }

        if (orderData.status === 'req-for-return') {


            const userid = req.session.user_id
            await users.findByIdAndUpdate({ _id: userid }, { $set: { wallet: totalBillAmount } })

            await order.updateOne({ _id: id }, { $set: { status: 'returned' } })

            // to increase the stock
            const product = orderData.product
            for (let i = 0; i < product.length; i++) {
                const productId = product[i].productId
                const productData = await productModel.findById({ _id: productId })
                if (productData.stock === 0) {
                    await productModel.findByIdAndUpdate(productId, { $set: { status: 'In Stock' } })
                }
                const quantity = product[i].count
                await productModel.findByIdAndUpdate(productId, { $inc: { stock: +quantity } })

            }
            // -----
            res.redirect('/admin/orders')
        }

    } catch (error) {
        console.log(error.message)
        return res.status(500).send("Internal Server Error");  

    }
}

// get sales report page with filter also
// ---------------------------------------------------------------------------------
const moment = require("moment-timezone");

const getSalesReport = async (req, res) => {
    try {
        let from = req.query.from ? moment.utc(req.query.from) : "ALL";
        let to = req.query.to ? moment.utc(req.query.to) : "ALL";

        if (from !== "ALL" && to !== "ALL") {
            const orderdetails = await order.aggregate([
                {
                    $match: {
                        date: {
                            $gte: new Date(from),
                            $lte: new Date(to.endOf("day"))
                        },
                        status: {
                            $nin: ["cancelled", "returned"]
                        }
                    }
                }
            ]);
            req.session.Orderdtls = orderdetails
            res.render("sales-report", { message: orderdetails, from, to, active:"salesreport" });
        } else {
            const orderdetails = await order.find({
                status: { $nin: ["cancelled", "returned"] }
            });
            console.log(orderdetails);
            req.session.Orderdtls = orderdetails
            res.render("sales-report", { message: orderdetails, from, to, active:"salesreport" });
        }
    } catch (error) {
        console.log(error);
    }
};

// ---------------------------------------------------------------------------------



const downloadSalesReport = async (req, res) => {
    try {
        const { Orderdtls } = req.session;

        // Create a new Excel workbook and worksheet
        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        // Define the columns in the worksheet
        worksheet.columns = [
            { header: 'User', key: 'user', width: 20 },
            { header: 'Date', key: 'date', width: 20 },
            { header: 'Payment Method', key: 'paymentMethod', width: 20 },
            { header: 'Total Amount', key: 'totalAmount', width: 20 },
            { header: 'Status', key: 'status', width: 20 },
        ];

        // Add data to the worksheet
        worksheet.addRows(Orderdtls);

        // Set response headers for file download
        const fileName = 'sales_report.xlsx';
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

        // Stream the Excel content to the response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};
//................................................................

const dailySales = async (req, res) => {
    try {
      const orderDate = req.body.daily;
      const startDate = moment(orderDate, 'YYYY-MM-DD').startOf('day').toDate();
      const endDate = moment(orderDate, 'YYYY-MM-DD').endOf('day').toDate();
      console.log(orderDate, "orderDate");
      console.log(startDate, "startDate");
      console.log(endDate, "endDate");
  
      dailyorders = await Order.find({
        date: {
          $gte: startDate,
          $lte: endDate
        }
      }).populate("address");
      // console.log(dailyorders, "DailyOrdersssss");
      totalOrderBill = dailyorders.reduce(
        (total, order) => total + Number(order.total),
        0
      );
      // console.log(totalOrderBill, "totalOrderBill");
      res.render('dailysales', { dailyorders, totalOrderBill, active:'salesreport' });
    } catch (error) {
      console.log(error.message);
    }
  };
  
  const dailyDownload = async (req, res) => {
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("Sales Data");
    worksheet.columns = [
      { header: "Order ID", key: "orderId", width: 10 },
      { header: "Delivery Name", key: "deliveryName", width: 20 },
      { header: "Order Date", key: "orderDate", width: 15 },
      { header: "Discount", key: "discount", width: 10 },
      { header: "Total Bill", key: "totalBill", width: 10 },
      { header: "totalOrders", key: "totalOrders", width: 10 },
      { header: "totalRevenue", key: "totalRevenue", width: 20 },
    ];
  
    dailyorders.forEach((order) => {
      worksheet.addRow({
        orderId: order.orderId,
        deliveryName: order.address.name,
        orderDate: order.date,
        discount: order.discount,
        totalBill: order.total,
      });
    });
    worksheet.addRow({
      totalOrders: dailyorders.length,
      totalRevenue: totalOrderBill,
    });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + "SalesData.xlsx"
    );
  
    workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((err) => {
  
        res.status(500).send("An error occurred while generating the Excel file");
      });
  };
  
  const monthlysales = async (req, res) => {
    try {
      const monthinput = req.body.month;
      // console.log(monthinput,"Monthhhhh")
      const year = parseInt(monthinput.substring(0, 4));
      const month = parseInt(monthinput.substring(5));
  
      // console.log(year,"year123",)
      // console.log(month,"month123")
  
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
  
      // console.log(startDate,"startDate")
      // console.log(endDate,"endDate")
  
      monthlyOrders = await Order.find({
        date: {
          $gte: startDate,
          $lte: endDate,
        },
        status: 'Delivered' // Filter by status
      })
        .sort({ date: 'desc' });
      totalMonthlyBill = monthlyOrders.reduce(
        (totall, order) => totall + Number(order.total),
        0
      );
  
  
      res.render("monthlyOrders", { monthlyOrders, totalMonthlyBill, active:'salesreport' });
    } catch (error) {
      console.log(error.message);
    }
  };
  
  const monthlyDownload = async (req, res) => {
    const workbook = new excel.Workbook
    const worksheet = workbook.addWorksheet('Sales Data');
    // Add headers to the worksheet
    worksheet.columns = [
      { header: "Order ID", key: "orderId", width: 10 },
      { header: "Order Date", key: "orderDate", width: 15 },
      { header: "Discount", key: "discount", width: 10 },
      { header: "Total Bill", key: "totalBill", width: 10 },
      { header: "totalOrders", key: "totalOrders", width: 10 },
      { header: "totalRevenue", key: "totalRevenue", width: 20 },
    ];
  
    monthlyOrders.forEach((order) => {
      worksheet.addRow({
        orderId: order.orderId,
        orderDate: order.date,
        discount: order.discount,
        totalBill: order.total,
      })
    })
    worksheet.addRow({
      totalOrders: monthlyOrders.length,
      totalRevenue: totalMonthlyBill,
    });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + "SalesData.xlsx"
    );
    workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((err) => {
        res.status(500).send("An error occurred while generating the Excel file");
      });
  };
  
  const yearlysales = async (req, res) => {
    try {
      const orders = await Order.find();
      const year = req.body.yearly;
  
      yearlyorders = orders.filter((order) => {
        const orderYear = new Date(order.date).getFullYear();
        return orderYear === parseInt(year);
      });
  
      totalYearlyBill = yearlyorders.reduce(
        (total, order) => total + Number(order.total),
        0
      );
      res.render("yearlyOrder", { yearlyorders, totalYearlyBill, active:'salesreport' });
    } catch (error) {
      res.status(500).send({ message: `${error}` });
    }
  };
  
  const yearlydownload = async (req, res) => {
    const workbook = new excel.Workbook;
    const worksheet = workbook.addWorksheet("Sales Data");
  
    // Add headers to the worksheet
    worksheet.columns = [
      { header: "Order ID", key: "orderId", width: 10 },
      { header: "Order Date", key: "orderDate", width: 15 },
      { header: "Discount", key: "discount", width: 10 },
      { header: "Total Bill", key: "totalBill", width: 10 },
      { header: "totalOrders", key: "totalOrders", width: 10 },
      { header: "totalRevenue", key: "totalRevenue", width: 20 },
    ];
  
    yearlyorders.forEach((order) => {
      worksheet.addRow({
        orderId: order.orderId,
        orderDate: order.date,
        discount: order.discount,
        totalBill: order.total,
      });
    });
    worksheet.addRow({
      totalOrders: yearlyorders.length,
      totalRevenue: totalYearlyBill,
    });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + "SalesData.xlsx"
    );
  
    workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((err) => {
  
        res.status(500).send("An error occurred while generating the Excel file");
      });
  };

module.exports = {
    getAdminPanel,
    getLogin,
    postLogin,
    getLogout,
    getUserManagement,
    unBlockUser,
    blockUser,
    getOrders,
    getSingleOrder,
    editOrder,
    getSalesReport,
    downloadSalesReport,
    dailySales,
    dailyDownload,
    monthlysales,
    monthlyDownload,
    yearlysales,
    yearlydownload
}
    