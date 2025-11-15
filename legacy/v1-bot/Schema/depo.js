const { Schema, model } = require("mongoose");

const schema = new Schema({
  world: String,
  owner: String,
  botName: String,
  ratedl: String,
  saweria: String,
  Trakteer: String,
});

const depo = model("depo", schema);

module.exports = depo;
