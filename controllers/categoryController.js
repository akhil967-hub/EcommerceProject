const category = require('../models/categoryModel')

// GET CATEGORY PAGE - /admin/categories
// ---------------------------------------------------------------------------------
const getCategory = async (req, res) => {
    try {
        const categoryDatas = await category.find()
        res.render('category', { message: categoryDatas, active:"category" })
    } catch (error) {
        console.log(error.message)
        return res.status(500).send("Internal Server Error");  

    }
}
// ---------------------------------------------------------------------------------



// GET ADD CATEGORY PAGE - /admin/categories/add
// ---------------------------------------------------------------------------------
const getAddCategoryPage = async (req, res) => {
    try {
        res.render('add-category', {active:"category"})
    } catch (error) {
        console.log(error.message)
        return res.status(500).send("Internal Server Error");  

    }
}
// ---------------------------------------------------------------------------------



// POST - ADD CATEGORY TO DB 
// ---------------------------------------------------------------------------------
const addCategory = async (req, res) => {
    try {
        const newCategory = req.body.category
        if (newCategory.trim().length == 0) {
            res.render('add-category', { message: 'Enter category name' , active:"category"}, )
        }
        const categoryExists = await category.findOne({ name: new RegExp('^' + newCategory + '$', 'i') })

        if (categoryExists) {
            res.render('add-category', { message: 'Category already registered', active:"category" })
        }
        else {
            const categoryData = new category({
                name: req.body.category,
                is_block: 0
            })
            const categoryDoc = await categoryData.save()
            res.redirect('/admin/category')
        }
    }
    catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");  

    }
}
// ---------------------------------------------------------------------------------



// TO BLOCK A CATEGORY 
// ---------------------------------------------------------------------------------
const blockCategory = async (req, res) => {
    try {
        const id = req.query.id
        await category.updateOne({ _id: id }, { $set: { is_block: 1 } })
        res.redirect('/admin/category')
    } catch (error) {
        console.log(error.message)
        return res.status(500).send("Internal Server Error");  

    }
}
// ---------------------------------------------------------------------------------



// TO UN BLOCK A CATEGORY
// ---------------------------------------------------------------------------------
const unBlockCategory = async (req, res) => {
    try {
        const id = req.query.id
        await category.updateOne({ _id: id }, { $set: { is_block: 0 } })
        res.redirect('/admin/category')
    } catch (error) {
        console.log(error.message)
        return res.status(500).send("Internal Server Error");  

    }
}
// ---------------------------------------------------------------------------------



const editCategory = async (req, res) => {
    try {
        const id = req.query.id;
        const categoryData = await category.findById({ _id: id });
        console.log(categoryData);

        if (categoryData) {
            res.render('edit-category', { categoryData, active:"category" });
        } else {
            res.redirect('/admin/category');
        }

    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");
    }
}


const postEditCategory = async (req, res) => {
    try {
        const id = req.body.id;
        
        const newData = await category.updateMany({ _id: id }, {
            $set: {
                name: req.body.name,
                // Add other fields for category update
            }
        });

        res.redirect('/admin/category');

    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");
    }
}


module.exports = {
    getCategory,
    getAddCategoryPage,
    addCategory,
    editCategory,
    postEditCategory,
    blockCategory,
    unBlockCategory
}