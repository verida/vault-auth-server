import Verida from '@verida/datastore'
import { v4 as uuidv4 } from 'uuid'
import dotenv from 'dotenv'
dotenv.config()

const APP_NAME = 'Vault: Auth Server'

const connections = {}
const veridaApp = new Verida({
    chain: process.env.CHAIN,
    address: process.env.ADDRESS,
    privateKey: process.env.PRIVATE_KEY,
    appName: APP_NAME
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
                    type: "auth-client-request",
                    message: requestJwt
                }))
                break
            case 'responseJwt':
                const response = await this.processResponseJwt(veridaApp, message.data)
                socket.send(JSON.stringify({
                    type: "auth-vault-response",
                    message: response
                }))
            default:
                // do nothing
                break
        }
    }

    async processResponseJwt(veridaApp, messageData) {
        const encryptedClientResponse = messageData.data
        const sessionId = messageData.sessionId

        // @todo: handle session not existing
        const clientSocket = connections[sessionId]

        // Send the response to the auth client
        clientSocket.send(JSON.stringify({
            type: "auth-client-response",
            response: encryptedClientResponse
        }))

        return {
            success: true
        }
    }

    async generateRequestJwt(veridaApp, sessionId) {
        const EXPIRY_OFFSET = process.env.EXPIRY_OFFSET
        const AUTH_URI = process.env.AUTH_URI
        const LOGIN_DOMAIN = process.env.LOGIN_DOMAIN
        const now = Math.floor(Date.now() / 1000)
        const expiry = now + EXPIRY_OFFSET

        const data = {
            type: 'verida-wss-auth',
            session: sessionId,
            appName: veridaApp.appName,
            authUri: AUTH_URI,
            loginDomain: LOGIN_DOMAIN
        }

        const didJwt = await veridaApp.user.createDidJwt(data, {
            expiry: expiry,
            appName: veridaApp.appName
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