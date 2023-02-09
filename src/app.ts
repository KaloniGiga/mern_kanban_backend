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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
     cb(null, __dirname + '/public');
  },

  filename: (req, file, cb) => {

    cb(null, file.originalname);
  }
})

const upload = multer({
  storage: storage,
  limits: {
      fileSize: 10000000
  },
  fileFilter(req, file, cb) {
      if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
          return cb(new Error('Please upload a valid image file'))
      }
      cb(null, true)
  }
})

app.post('/api/v1/image', upload.single('profile'), async (req, res) => {
  try {
       console.log(req.file)

      const filename = `user--${Date.now()}.jpeg`;

      // await sharp(req.file?.buffer).resize({ width: 250, height: 250 }).toFormat('jpeg').jpeg({quality: 90}).toFile(__dirname + `public/${filename}`)
       res.status(201).send('Image uploaded succesfully')
  } catch (error) {
      console.log(error)
      res.status(400).send(error)
  }
})

app.use(errorMiddleware)

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running at port: ${process.env.PORT}`);
});
