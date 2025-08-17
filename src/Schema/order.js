const { Schema, model } = require("mongoose");

const schema = new Schema({
  Order: Number,
});

const order = model("order", schema);

module.exports = order;
