const mongoose = require('mongoose')

const categorySchema = mongoose.Schema({
   name: {
      type: String,
      required: true,
      trim: true
   },
   is_block: {
      type: Boolean,
      required:true
   }


})

module.exports = mongoose.model('categories', categorySchema)