import express, { request, response } from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import fs from "fs";

import roleRoutes from './routes/role.Routes.js';
import objectTypeRouter from './routes/objectType.routes.js';
import organizationRouter from './routes/organization.routes.js';
import personRouter from './routes/person.routes.js';
import userRouter from './routes/user.routes.js';
import privilegeRouter from './routes/privilege.routes.js';
import utilRouter from './routes/utils.routes.js';
import { fileURLToPath } from "url";
import path from "path";
import playListRouter from './routes/PlayList.routes.js';
import assetRouter from './routes/asset.routes.js';
import { getTags  } from './controllers/tag.controller.js';
import logMiddleware from './utils/log.middleware.js'

dotenv.config(); 

mongoose.connect(process.env.DB_URL, { dbName: process.env.DB_NAME }).then(()=>console.log('mongoDB connected successfullyxxxx.'));;

const app = express();

app.use(express.json());
app.use( cors({ origin: process.env.CLIENT_URL, methods: ["GET","POST","PUT","DELETE","OPTIONS"], allowedHeaders: ["Content-Type", "Authorization"], credentials: true, }) );

app.use(logMiddleware);

app.get('/', (request, response)=>{ response.status(200).send('Welcome to Organization & Security module.'); });
app.get('/tags', getTags);

app.use('/objecttypes', objectTypeRouter);
app.use('/organizations', organizationRouter);
app.use('/users', userRouter);
app.use('/persons', personRouter);
app.use('/roles', roleRoutes);
app.use('/privilege', privilegeRouter);
app.use('/audit', utilRouter);

app.use('/assets', assetRouter);
app.use('/playlists', playListRouter);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/downloads/:filename", (req, res) => {
  const { filename } = req.params;

  const filePath = path.join(process.cwd(), "uploads", filename);

//  if (!fs.existsSync(filename)) {
//    return res.status(404).json({ message: "File not found" });
//  }

  res.download("https://storage.googleapis.com/kasip18_app1_bucket1/uploads/1766650226326-image4.jpeg", filename); // 👈 forces download

});

app.listen(process.env.PORT || 5000, ()=>{ console.log('Server is running at port '+ process.env.PORT || 5000)});
