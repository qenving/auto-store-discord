const { Schema, model } = require("mongoose")

const schema = new Schema({
    ChanelTesti: String
});

const setchannel = model("setchannel", schema)

module.exports = setchannel