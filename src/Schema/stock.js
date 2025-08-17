const { Schema, model } = require("mongoose")

const schema = new Schema({
    Public: Boolean
})

const stock = model("stock", schema)

module.exports = stock