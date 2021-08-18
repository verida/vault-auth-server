import Verida from '@verida/datastore'
import { v4 as uuidv4 } from 'uuid'
const _ = require("lodash")
import dotenv from 'dotenv'
dotenv.config()

const APP_NAME = 'Vault: Auth Server'

const connections = {}
const requests = {}
import { config as CONFIG } from '../config'

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
                const contextName = message.contextName ? message.contextName : message.appName
                const contextConfig = this.getContextConfig(contextName)
                if (!contextConfig) {
                    socket.send(JSON.stringify({
                        type: "error",
                        message: 'Context name not configured'
                    }))
                    break
                }

                const requestJwt = await this.generateRequestJwt(sessionId, contextName, message.payload)
                socket.send(JSON.stringify({
                    type: "auth-client-request",
                    message: requestJwt
                }))
                break
            case 'getSession':
                console.log(requests, message)
                if (typeof(requests[message.data.sessionId]) == 'undefined') {
                    socket.send(JSON.stringify({
                        type: "error",
                        message: 'Invalid session ID'
                    }))
                    break
                }

                socket.send(JSON.stringify({
                    type: "auth-session",
                    message: requests[message.data.sessionId]
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

    async generateRequestJwt(sessionId, contextName, payload) {
        const contextConfig = this.getContextConfig(contextName)

        const veridaApp = new Verida({
            chain: contextConfig.chain,
            address: contextConfig.address,
            privateKey: contextConfig.privateKey,
            appName: contextName
        })

        const EXPIRY_OFFSET = parseInt(process.env.EXPIRY_OFFSET)
        const AUTH_URI = process.env.AUTH_URI
        const LOGIN_DOMAIN = contextConfig.loginDomain
        const now = Math.floor(Date.now() / 1000)
        const expiry = now + EXPIRY_OFFSET

        payload = _.merge({
            appName: contextName,       // todo: update when we transition to context name not app name
            loginDomain: LOGIN_DOMAIN
        }, payload)

        const data = {
            type: 'verida-wss-auth',
            session: sessionId,
            authUri: AUTH_URI
        }

        const didJwt = await veridaApp.user.createDidJwt(data, {
            expiry: expiry
        })

        data.expiry = expiry
        requests[sessionId] = payload

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

    getContextConfig(contextName) {
        const defaultContextConfig = CONFIG.defaultContext ? CONFIG.defaultContext : null
        const contextConfig = CONFIG.contexts[contextName] ? CONFIG.contexts[contextName] : defaultContextConfig
        return contextConfig
    }

}

const sessionManager = new SessionManager()
export default sessionManager