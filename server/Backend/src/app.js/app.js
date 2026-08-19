import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotnev from "dotenv";
dotnev.config();
const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.get("/", (req, res) => {
    res.status(200).json({
    status:
    msg:
});
});
export default app;