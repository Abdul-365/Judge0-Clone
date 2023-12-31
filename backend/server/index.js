import express from 'express';
import bodyparser from 'body-parser';
import mongoose from "mongoose";
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import cors from 'cors';
import auth from './auth';
require('dotenv').config();
import userRoutes from './routes/userRoutes';
import codeRoutes from './routes/codeRoutes';
import { createContainerPool } from './controllers/codeController';
const app = express();

// Connect Database
mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then((data) => {
    console.log(`MongoDB connected with server ${data.connection.host}`);
});

// bodyparser setup
app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());

// cors
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    optionSuccessStatus: 200
}));

// cookies and seesions
app.use(cookieParser());
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URL,
    })
}))
app.use(auth.initialize);
app.use(auth.session);
app.use(auth.setUser);

// routes
userRoutes(app);
codeRoutes(app);
app.get('/', function (req, res) {
    res.send('Judge0 Clone API')
});

// create the container pool and start the server
async function startServer() {
    try {
        await createContainerPool();
        app.listen(process.env.PORT, () =>
            console.log(`Server running on port ${process.env.PORT}`)
        );
    } catch (error) {
        console.error('Failed to start server', error);
        // handle the error, e.g. by logging the error or exiting the application
    }
}

startServer();