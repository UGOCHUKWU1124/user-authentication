import express from "express"
import { connectdatabase } from "./config/database.js";
import dotenv from "dotenv"
import cookieParser from "cookie-parser";
import authRoute from "./routes/authRoute.js";


dotenv.config();

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies from incoming requests: req.body
app.use(cookieParser);

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Backend is running!");
});
app.use("/api/auth", authRoute);

app.listen(PORT, () => {
    connectdatabase();
    console.log(`Server is running on: PORT ${PORT}` );
});





