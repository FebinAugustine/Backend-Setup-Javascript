import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

/* MIDDLEWARES */

/* Set up weburl as origin */
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// app.get("/", (req, res) => {
//   res.send("Hello from the server!"); // You can send any text or HTML here
// });

/* Routes Import */
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";

/* Routes Declaration */
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);

export { app };
