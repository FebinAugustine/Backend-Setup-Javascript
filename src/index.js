import dotenv from "dotenv";

import connectDB from "./db/db.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

const port = process.env.PORT || 3000;
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port: ${port}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection error", err);
  });

/*

First approch

import mongoose from "mongoose";
import { DB_NAME } from "./constants";

import express from "express";
const app = express;

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", (error) => {
      console.log("Error: ", error);
      throw error;
    });

    app /
      addListener(process.env.PORT, () => {
        console.log(`App is listening on ${process.env.PORT}`);
      });
  } catch (error) {
    console.error("ERROR: ", error);
    throw err;
  }
})();
*/
