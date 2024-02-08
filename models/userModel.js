const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
   name: {
      type: String,
      required: true,
      trim: true
   },
   email: {
      type: String,
      required: true,
      trim:true,
      unique:true
   },
   password: {
      type: String,
      required: true,
      trim: true
   },
   mobile: {
      type: Number,
      required: true,
      trim:true
   },
   wallet: {
      type: Number,
      default: 100
   },
   is_admin: {
      type: Number,
      required: true
   },
   is_verified: {
      type: Number,
      required: true
   },
   token: {
      type: String,
      default: ''
   },
   is_block: {
      type: Number,
      required:true
   }


})

module.exports = mongoose.model('users', userSchema)