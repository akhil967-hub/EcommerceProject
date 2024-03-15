const category = require('../models/categoryModel')

// GET CATEGORY PAGE - /admin/categories
// ---------------------------------------------------------------------------------
const getCategory = async (req, res) => {
    try {
        const categoryDatas = await category.find()
        res.render('category', { message: categoryDatas, active:"category" })
    } catch (error) {
        console.log(error.message)
        return res.status(500).render('admin500');

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
        return res.status(500).render('admin500');

    }
}
// ---------------------------------------------------------------------------------



// POST - ADD CATEGORY TO DB 
// ---------------------------------------------------------------------------------
const addCategory = async (req, res) => {
    try {
        const newCategory = req.body.category;
        if (newCategory.trim().length == 0) {
            res.render('add-category', { message: 'Enter category name', active: "category" });
            return; // Ensure to return after rendering the response
        }

        const categoryExists = await category.findOne({ name: new RegExp('^' + newCategory + '$', 'i') });

        if (categoryExists) {
            res.render('add-category', { message: 'Category already registered', active: "category" });
        } else {
            const categoryData = new category({
                name: req.body.category,
                is_block: 0
            });
            const categoryDoc = await categoryData.save();
            res.redirect('/admin/category');
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).render('admin500');
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
        return res.status(500).render('admin500');

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
        return res.status(500).render('admin500');

    }
}
// ---------------------------------------------------------------------------------



const editCategory = async (req, res) => {
    try {
        const id = req.query.id;
        const categoryData = await category.findById({ _id: id });
        

        if (categoryData) {
            res.render('edit-category', { categoryData,  active:"category" });
        } else {
            res.redirect('/admin/category');
        }

    } catch (error) {
        console.log(error.message);
        return res.status(500).render('admin500');
    }
}


const postEditCategory = async (req, res) => {
    try {
        const id = req.body.id;
        
        const newData = await category.updateMany({ _id: id }, {
            $set: {
                name: req.body.name,
            }
        });

        res.redirect('/admin/category');
    

    } catch (error) {
        console.log(error.message);
        return res.status(500).render('admin500');
    }
}

const fetchCategory = async (req, res)=>{
    try{

    const categoryNames = await category.find({})
    res.json(categoryNames)

}catch(error){
    res.status(500).render('admin500')
}
}


module.exports = {
    getCategory,
    getAddCategoryPage,
    addCategory,
    editCategory,
    postEditCategory,
    blockCategory,
    unBlockCategory, 
    fetchCategory
}