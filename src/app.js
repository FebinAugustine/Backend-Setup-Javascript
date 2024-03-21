import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

/* Set up weburl as origin */
app.use({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
});
/* currently body parser is included in express package
no need for seperate use */
app.use(express.json({ limit: "16kb" }));

/* Setup public folder path. Static files */
app.use(express.static("public"));

/* set up cookie parser */
app.use(cookieParser());

// url encoder
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

export default app;
