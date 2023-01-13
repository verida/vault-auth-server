import { AutoAccount } from '@verida/account-node'

import { v4 as uuidv4 } from 'uuid'

const connections = {}
const requests = {}
import CONFIG from './config'

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

class SessionManager {

    async connect(socket) {
        const sessionId = uuidv4()
        console.log("Created session: " + sessionId)

        connections[sessionId] = socket
        console.log("Total sessions: " + Object.keys(connections).length)
        console.log("Total pending requests: " + Object.keys(requests).length)

        return sessionId
    }

    async message(sessionId, messageJson) {
        const message = JSON.parse(messageJson)
        console.log(`Message received from ${sessionId}:`, message)

        const socket = connections[sessionId]

        switch (message.type) {
            case 'generateJwt':
                if (typeof(CONFIG[message.appName]) == 'undefined') {
                    socket.send(JSON.stringify({
                        type: "error",
                        message: 'Invalid application name'
                    }))
                    break
                }

                const requestJwt = await this.generateRequestJwt(sessionId, message.appName)
                socket.send(JSON.stringify({
                    type: "auth-client-request",
                    message: requestJwt
                }))
                break
            case 'responseJwt':
                const response = await this.processResponseJwt(message.sessionId, message.data)
                delete requests[message.sessionId]
                socket.send(JSON.stringify({
                    type: "auth-vault-response",
                    ...response
                }))
            default:
                // do nothing
                break
        }
    }

    async processResponseJwt(sessionId, encryptedClientResponse) {
        const clientSocket = connections[sessionId]
        this.gc()

        if (!clientSocket) {
            return {
                success: false,
                code: 50,
                message: `Unable to locate session, try reloading the QR code`
            }
        }

        const request = requests[sessionId]

        // Verify the request hasn't expired for this session
        if (!request || this.hasRequestExpired(request)) {
            return {
                success: false,
                coide: 51,
                message: `Request has expired, try reloading the QR code`
            }
        }

        // Send the response to the auth client
        clientSocket.send(JSON.stringify({
            type: "auth-client-response",
            success: true,
            message: encryptedClientResponse
        }))

        return {
            success: true
        }
    }

    async generateRequestJwt(sessionId, contextName) {
        let contextConfig
        if (CONFIG.CONTEXTS[contextName]) {
            contextConfig = CONFIG.CONTEXTS[contextName]
        } else {
            if (CONFIG.DEFAULT_CONTEXT) {
                contextConfig = CONFIG.CONTEXTS[CONFIG.DEFAULT_CONTEXT]
            } else {
                throw new Error(`Unknown application context (${contextName}): Not found in config`)
            }
        }

        const account = new AutoAccount(DEFAULT_ENDPOINTS, {
            environment: CONFIG.VERIDA_ENVIRONEMNT,
            privateKey: contextConfig.PRIVATE_KEY,
            didClientConfig: DID_CLIENT_CONFIG
        })

        const EXPIRY_OFFSET = CONFIG.EXPIRY_OFFSET
        const AUTH_URI = CONFIG.AUTH_URI
        const LOGIN_DOMAIN = contextConfig.loginDomain
        const now = Math.floor(Date.now() / 1000)
        const expiry = now + EXPIRY_OFFSET

        const data = {
            type: 'verida-wss-auth',
            session: sessionId,
            appName: contextName,
            contextName,
            authUri: AUTH_URI,
            loginDomain: LOGIN_DOMAIN
        }

        const didJwt = await account.createDidJwt(contextName, data, {
            expiry: expiry,
            appName: appName,
            contextName,
        })

        data.expiry = expiry
        requests[sessionId] = data

        return didJwt
    }

    async close(sessionId) {
        console.log("Closing session: " + sessionId)
        delete connections[sessionId]
    }

    hasRequestExpired(request) {
        // Verify the request hasn't expired for this session
        const now = Math.floor(Date.now() / 1000)
        const expiry = request.expiry

        if (expiry < now) {
            return true
        }

        return false
    }

    // Garbage collect expired requests 5% of the time
    gc() {
        const random = getRandomInt(0,20)
        if (random == 1) {
            for (var i in requests) {
                let request = requests[i]
                if (this.hasRequestExpired(request)) {
                    delete requests[i]
                }
            }
        }
    }

}

const sessionManager = new SessionManager()
export default sessionManager