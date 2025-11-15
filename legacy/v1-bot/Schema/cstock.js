const { Schema, model } = require("mongoose")

const schema = new Schema({
    Chanel: String
})

const ctesti = model("cstock", schema)

module.exports = ctesti