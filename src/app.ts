import express from "express";
import { config } from "dotenv";
import { configureDB } from "./utils/db";
import cors from "cors";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/userProfile.route";
import path from "path";
import workspaceRoutes from "./routes/workspace.route";
import boardRoutes from "./routes/board.route";
import favoriteRoutes from "./routes/favorite.route";
import cardRoutes from "./routes/card.route";
import listRoutes from "./routes/list.route";
import errorMiddleware from "./middlewares/error.middleware";
import multer from "multer";
import sharp from "sharp";

//configure the dotenv
config();

//make the instance of express app
const app = express();

//configure mongodb
configureDB();

const BASE_PATH = process.env.BASE_PATH || "/api/v1";
const STATIC_PATH = process.env.STATIC_PATH || "/static";
const PUBLIC_DIR_NAME = process.env.PUBLIC_DIR_NAME || "public";

//middleware
app.use(cors({ credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  BASE_PATH + STATIC_PATH,
  express.static(path.join(__dirname, PUBLIC_DIR_NAME))
);



//configure routes
app.use("/api/v1", userRoutes);
app.use("/api/v1", authRoutes);
app.use("/api/v1", workspaceRoutes);
app.use("/api/v1", boardRoutes);
app.use("/api/v1", favoriteRoutes);
app.use("/api/v1", cardRoutes);
app.use("/api/v1", listRoutes);


app.use(errorMiddleware)

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running at port: ${process.env.PORT}`);
});
