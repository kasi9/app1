import express from 'express';
import dotenv from 'dotenv';

import helmet from "helmet";
import mongoose from 'mongoose';
import cors from 'cors';

import roleRoutes from './routes/role.Routes.js';
import objectTypeRouter from './routes/objectType.routes.js';
import organizationRouter from './routes/organization.routes.js';
import personRouter from './routes/person.routes.js';
import userRouter from './routes/user.routes.js';
import privilegeRouter from './routes/privilege.routes.js';
import utilRouter from './routes/utils.routes.js';
//import { fileURLToPath } from "url";
//import path from "path";
import playListRouter from './routes/PlayList.routes.js';
import assetRouter from './routes/asset.routes.js';
import { getTags  } from './controllers/tag.controller.js';
import logMiddleware from './utils/log.middleware.js'

dotenv.config(); 
const allowedOrigins = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : [];
//const allowedOrigins = process.env.CLIENT_URL.split(",");

const app = express();
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// CLIENT_URL=https://app1.vercel.app,https://admin.app1.com

app.use(cors({
   origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) 
        cb(null, true);
    else 
        cb(new Error("CORS blocked"));
    },
    credentials: true
}));

//app.use( cors({ origin: process.env.CLIENT_URL, methods: ["GET","POST","PUT","DELETE","OPTIONS"], allowedHeaders: ["Content-Type", "Authorization"], credentials: true, }) );
app.use((req, res, next) => {
    try {
        logMiddleware(req, res, next);
    } catch (err) {
        console.error("Log error:", err);
        next(); 
    }
});

app.get('/', (request, response)=>{ response.status(200).send('Welcome to App1.'); });
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

//const __filename = fileURLToPath(import.meta.url);
//const __dirname = path.dirname(__filename);

//app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/*app.get("/downloads/:filename", (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), "uploads", filename);
    res.download("https://storage.googleapis.com/kasip18_app1_bucket1/uploads/1766650226326-image4.jpeg", filename); // 👈 forces download

//  if (!fs.existsSync(filename)) {
//    return res.status(404).json({ message: "File not found" });
//  }
});*/

const startServer = async () => {
    try {
        await mongoose.connect(process.env.DB_URL, { dbName: process.env.DB_NAME, });
        console.log("MongoDB connected successfully.");
        app.listen(process.env.PORT || 5000, () => { console.log("Server running at port", process.env.PORT || 5000); });
    } catch (err) {
        console.error("MongoDB connection failed:", err.message);
        process.exit(1);
    }
};

startServer();

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: "Internal Server Error" });

    if (err instanceof multer.MulterError) {
        return res.status(400).json({ success:false, message: err.message });
    }
    if (err.message === "Only audio files allowed") {
        return res.status(400).json({ success:false, message: err.message });
    }
    console.error(err);
    res.status(500).json({ success:false, message:"Upload failed" });
});
