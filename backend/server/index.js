import express from 'express';
import bodyparser from 'body-parser';
import mongoose from "mongoose";
import cookieParser from 'cookie-parser';
import cors from 'cors';
require('dotenv').config();
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
app.use(bodyparser.json({ limit: "150mb", extended: true }))
app.use(bodyparser.urlencoded({ limit: "150mb", extended: true, parameterLimit: 50000 }))

// cors
const corsOptions = {
    origin: process.env.FRONTEND_URL,
    credentials: true,
    optionSuccessStatus: 200
}
app.use(cors(corsOptions));

app.use(cookieParser());

app.get('/', function (req, res) {
    res.send('Welcome to our API')
})

app.listen(process.env.PORT, () =>
    console.log(`Server running on port ${process.env.PORT}`)
);