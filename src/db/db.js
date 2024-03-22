import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    // tells to which host the connection is made
    console.log(
      `Mongo db connected !! DB host: ${connectInstance.connection.host}`
    );
  } catch (error) {
    console.error("MongoServerError: Bad Auth : Authentication Failed ", error);
    process.exit(1);
  }
};

export default connectDB;
