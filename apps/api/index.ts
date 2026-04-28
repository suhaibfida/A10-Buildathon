import "dotenv/config";
import express from "express";
const app = express();
import cookieParser from "cookie-parser";
import cors from "cors";
import router from "./router/router.js"
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use(express.json());
app.use("/api/v1", router)
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});