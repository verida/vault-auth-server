import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import router from './routes';

import dotenv from 'dotenv';
dotenv.config();

// Set up the express app
const app = express();

let corsConfig = {};

// Parse incoming requests data
app.use(cors(corsConfig));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(router);

const PORT = 7001;
app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`)
});