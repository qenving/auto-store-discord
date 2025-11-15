const { Schema, model } = require("mongoose")

const sche = new  Schema({
	code: String,
	data: String,
})

const shop = model("shop", sche)

module.exports = shop