const mongoose = require("mongoose");

const MONGO_URL = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/drivesecure";

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("connected to db");
  } catch (err) {
    console.error("Failed to connect to db", err);
    process.exit(1);
  }
};

module.exports = connectDB;
