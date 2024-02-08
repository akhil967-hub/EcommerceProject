const session = require('express-session')
const banners = require('../models/bannerModel')

// Get banner view page
// --------------------------------------------------------------
const getBannerPage = async function (req, res) {
    try {
        const bannerData = await banners.find()
        console.log(bannerData);
        res.render("banner",{message: bannerData, active:"banners"}) 
    } catch (error) {
        console.log(error);
    }
}
// --------------------------------------------------------------

// Get banner view page
// --------------------------------------------------------------
const getBannerAddPage = async function (req, res) {
    try {
        
        res.render("add-banner", {active:"banners"}) 
    } catch (error) {
        console.log(error);
    }
}
// --------------------------------------------------------------

// Post add banner
// --------------------------------------------------------------
const addBanner = async function (req, res) {
    try {
        const bannerData = new banners({
            name: req.body.name,
            image: req.file.filename
        })
        await bannerData.save()
        res.redirect('/admin/banners')
        
        res.render("add-banner", {active:"banners"}) 
    } catch (error) {
        console.log(error);
    }
}
// --------------------------------------------------------------

// Post add banner
// --------------------------------------------------------------
const statusChange = async function (req, res) {
    try {
        const id = req.query.id
        const banner = await banners.findById({_id:id})

        if(banner.status==='true'){
            await banners.findByIdAndUpdate({_id:id},{$set:{status:'false'}})
        }else{
            await banners.findByIdAndUpdate({_id:id},{$set:{status:'true'}})
        }
        res.redirect("/admin/banners")
    } catch (error) {
        console.log(error);
    }
}
// --------------------------------------------------------------

module.exports={
    getBannerPage,
    getBannerAddPage,
    addBanner,
    statusChange
}

