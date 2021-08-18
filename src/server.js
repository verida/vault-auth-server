const WebSocket = require('ws')
import SessionManager from './SessionManager'

import dotenv from 'dotenv'
dotenv.config()

const PORT = process.env.PORT

const wss = new WebSocket.Server({
  port: PORT
})

wss.on('connection', async function connection(ws, req) {
    const sessionId = await SessionManager.connect(ws, req)

    ws.on('message', (m) => {
        SessionManager.message(sessionId, m)
    });

    ws.on('close', () => {
        SessionManager.close(sessionId)
    });
});