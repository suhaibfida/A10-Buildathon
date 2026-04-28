import express from "express";
const app = express();
import cookieParser from "cookie-parser";
import cors from "cors";
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));


app.use(express.json());
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});