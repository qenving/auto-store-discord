const { Schema, model } = require("mongoose")

const schema = new Schema({
    Channel: String,
    MessageID: String,
});

const setchannel = model("channelrt", schema)

module.exports = setchannel