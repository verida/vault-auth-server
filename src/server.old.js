import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import router from './routes';
const WebSocket = require('ws');

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
/*app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`)
});*/

const wss = new WebSocket.Server({
  port: process.env.PORT
});

const connections = {}

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    ws.send("thanks!");
  });

  ws.send('something');
});