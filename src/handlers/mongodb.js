const mongoose = require('mongoose');
const { MongoURL } = require("../config/config.json");
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MongoURL);
        console.log("----------------------------------------".yellow);
        console.log(`MONGO DB: ${conn.connection.host}`.green.underline);
        console.log("----------------------------------------".yellow);
    } catch (error) {
        console.log(`[SYSTEM ERROR]`.bgRed.bold, `Already Error In MongoDB!\n${error}`.red)
        process.exit(1);
    }
}

module.exports = connectDB