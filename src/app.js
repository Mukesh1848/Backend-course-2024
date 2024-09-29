import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'
const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    Credential: true,
}))

app.use(express.json({limit: '16kb'})); // json data limit
app.use(express.urlencoded({extended:true,limit: '16kb'}))  // to encode url friendly data
app.use(express.static("public"))
app.use(cookieParser());

// routes import 
import userRouter from './routes/user.routes.js';

// API Example -> http://localhost:6000/api/v1/users/register

// routes declaration 
app.use("/api/v1/users",userRouter);

export {app};