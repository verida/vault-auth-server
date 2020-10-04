const WebSocket = require('ws')
import SessionManager from './SessionManager'

import dotenv from 'dotenv'
dotenv.config()

const PORT = process.env.PORT

const wss = new WebSocket.Server({
  port: PORT
})

wss.on('connection', async function connection(ws) {
    const sessionId = await SessionManager.connect(ws)

    ws.on('message', (m) => {
        SessionManager.message(sessionId, m)
    });

    ws.on('close', () => {
        SessionManager.close(sessionId)
    });
});