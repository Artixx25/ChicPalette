import dotenv from 'dotenv/config.js';
import express from "express";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import router from './router/index.js';
import bodyParser from "body-parser";
import { errorMiddleware } from "./middlewares/error-middleware.js";
import { authMiddleware } from './middlewares/auth-middleware.js';
import multer from "multer";
import helmet from "helmet";
import morgan from "morgan";
import path from 'path'
import { fileURLToPath } from "url";
// file upload
import postController from './controllers/post-controller.js'
import userController from './controllers/user-controller.js'

/* CONFIGURATIONS */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
const app = express()
app.use(express.json());
// file upload
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));

app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(cookieParser());
app.use(cors({
  credentials: true,
  origin: process.env.CLIENT_URL,
  optionSuccessStatus:200
}));
app.use("/assets", express.static(path.join(__dirname, "./public/assets")));
app.use("/profiles", express.static(path.join(__dirname, "./public/profiles")));

/* FILE STORAGE */
const postsStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/assets");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const profilesStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/profiles");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const uploadPost = multer({ storage: postsStorage, limits: { fileSize: 61999999, fieldNameSize: 300, }, fileFilter: (req, file, cb) => {
    if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg" || file.mimetype == "image/gif" || file.mimetype == "video/mp4" || file.mimetype == "video/webm") {
      cb(null, true);
    } else {
      cb(null, false);
      const err = new Error('Only .png, .jpg, .jpeg, .gif, .mp4 and .webm format allowed!')
      err.name = 'ExtensionError'
      return cb(err);
    }
  }
})

const uploadProfile = multer({ storage: profilesStorage, limits: { fileSize: 61999999, fieldNameSize: 300, }, fileFilter: (req, file, cb) => {
  if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg" || file.mimetype == "image/gif") {
    cb(null, true);
  } else {
    cb(null, false);
    const err = new Error('Only .png, .jpg, .jpeg, and .gif format allowed!')
    err.name = 'ExtensionError'
    return cb(err);
  }
}
})


app.use('/api', router);

app.post("/api/posts", authMiddleware, uploadPost.array("pictures", 6), postController.createPost);

app.patch('/api/profile/:username/edit', authMiddleware, uploadProfile.array("profileImages", 2), userController.editUserProfile);

app.use(errorMiddleware)

const start = async () => {
  try {
    await mongoose.connect(process.env.DBURL)
    app.listen(PORT, () => console.log(`PORT: ${PORT}`))
  } catch (e) {
    console.log(e)
  }
}

start()