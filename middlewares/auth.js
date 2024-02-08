const users = require('../models/userModel')


const isLogin = async(req,res,next)=>{
    try {
        const user = await users.findById(req.session?.user_id)

        if(user){
            if(user.is_block === 0){
             return next()
            
            }else{
              return res.render('404')
            }
        }else{
           return res.redirect("/login");
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");  

    }
}

const isUserLogin = async(req,res,next)=>{
    try {
        const user = await users.findById(req.session?.user_id)
        if(user){
            if(user.is_block === 1){
                return res.render('404')
            }
        }
           return next()
        
    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");  

    }
}

const isLoginHome = async(req,res,next)=>{
    try {
        const user = await users.findById(req.session?.user_id)
        if(user){
            if(user.is_block === 1){
            
              return res.render('404')
            }else{
              return res.redirect('/')
            }
        }else{
            return next()
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");  

    }
}

  
module.exports = {
    isLogin,
    isLoginHome,
    isUserLogin
}