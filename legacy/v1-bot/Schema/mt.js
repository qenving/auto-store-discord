const { Schema, model } = require("mongoose")

const schema = new Schema({
    mt: Boolean
})

const mt = model("mt", schema)

module.exports = mt