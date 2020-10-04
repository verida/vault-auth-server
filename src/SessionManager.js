import Verida from '@verida/datastore'
import { v4 as uuidv4 } from 'uuid'
import dotenv from 'dotenv'
dotenv.config()

const connections = {}
const veridaApp = new Verida({
    chain: process.env.CHAIN,
    address: process.env.ADDRESS,
    privateKey: process.env.PRIVATE_KEY,
    appName: 'Vault: Auth Server'
})

class SessionManager {

    async connect(socket) {
        const sessionId = uuidv4()
        console.log("Created session: " + sessionId)

        connections[sessionId] = socket
        console.log("Total sessions: " + Object.keys(connections).length)

        return sessionId
    }

    async message(sessionId, messageJson) {
        const message = JSON.parse(messageJson)
        console.log(`Message received from ${sessionId}:`, message)

        const socket = connections[sessionId]

        switch (message.type) {
            case 'generateJwt':
                const requestJwt = await this.generateRequestJwt(veridaApp, sessionId)
                socket.send(JSON.stringify({
                    type: "auth",
                    message: requestJwt
                }))
                break
            default:
                // do nothing
                break
        }
    }

    async generateRequestJwt(veridaApp, sessionId) {
        const EXPIRY_OFFSET = process.env.EXPIRY_OFFSET
        const AUTH_URI = process.env.AUTH_URI
        const now = Math.floor(Date.now() / 1000)
        const expiry = now / 1000.0 + EXPIRY_OFFSET

        const data = {
            type: 'verida-wss-auth',
            session: sessionId,
            authUri: AUTH_URI
        }

        const didJwt = await veridaApp.user.createDidJwt(data, {
            expiry: expiry
        })

        return didJwt
    }

    async close(sessionId) {
        console.log("Closing session: " + sessionId)
        delete connections[sessionId]
    }

}

const sessionManager = new SessionManager()
export default sessionManager