const WebSocket = require('ws')
import SessionManager from './SessionManager'

import CONFIG from './config/index'

const wss = new WebSocket.Server({
  port: CONFIG.PORT
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