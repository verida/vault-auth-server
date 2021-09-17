import { Network } from "@verida/client-ts"
import { AutoAccount } from "@verida/account-node"
import { v4 as uuidv4 } from 'uuid'
const _ = require("lodash")
import dotenv from 'dotenv'
dotenv.config()

const APP_NAME = 'Vault: Auth Server'

const connections = {}
const requests = {}
const contexts = {}
import { config as CONFIG } from '../config'

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

class SessionManager {

    async connect(socket, req) {
        const sessionId = uuidv4()
        console.log("Created session: " + sessionId)

        connections[sessionId] = {
            socket,
            origin: req.headers.origin
        }

        console.log("Total sessions: " + Object.keys(connections).length)
        console.log("Total pending requests: " + Object.keys(requests).length)

        return sessionId
    }

    async message(sessionId, messageJson) {
        const message = JSON.parse(messageJson)
        console.log(`Message received from ${sessionId}:`, message)

        const socket = connections[sessionId].socket
        const origin = connections[sessionId].origin

        switch (message.type) {
            case 'generateJwt':
                const contextName = message.context
                const contextConfig = this.getContextConfig(contextName)
                if (!contextConfig) {
                    socket.send(JSON.stringify({
                        type: "error",
                        message: 'Context name not configured'
                    }))
                    break
                }

                if (!this.verifyRequestDomain(contextConfig, origin)) {
                    socket.send(JSON.stringify({
                        type: "error",
                        message: 'Permission denied. Request has come from an unauthorized domain.'
                    }))
                    break
                }

                try {
                    const requestJwt = await this.generateRequestJwt(sessionId, contextName, message.payload)
                    socket.send(JSON.stringify({
                        type: "auth-client-request",
                        message: requestJwt
                    }))
                } catch (err) {
                    console.error(err)
                    socket.send(JSON.stringify({
                        type: "error",
                        message: 'Unknown error occurred. Please try again.'
                    }))
                }
                
                break
            case 'getSession':
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
        const clientSocket = connections[sessionId].socket
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
        const context = await this.getContext(contextName)
        const account = await context.getAccount()
        const contextConfig = this.getContextConfig(contextName)

        const EXPIRY_OFFSET = parseInt(process.env.EXPIRY_OFFSET)
        const AUTH_URI = process.env.AUTH_URI
        const LOGIN_DOMAIN = contextConfig.loginOrigin
        const now = Math.floor(Date.now() / 1000)
        const expiry = now + EXPIRY_OFFSET

        payload = _.merge(payload, {
            context: contextName,       // todo: update when we transition to context name not app name
            loginDomain: LOGIN_DOMAIN
        })

        const data = {
            type: 'verida-wss-auth',
            session: sessionId,
            authUri: AUTH_URI
        }

        const didJwt = await account.createDidJwt(contextName, data, {
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

    async getContext(contextName) {
        if (typeof(contexts[contextName]) !== "undefined") {
            return contexts[contextName]
        }

        const contextConfig = this.getContextConfig(contextName)
        const account = new AutoAccount(contextConfig.chain, contextConfig.privateKey)
        const context = await Network.connect({
            context: {
                name: contextName
            },
            client: {
                defaultDatabaseServer: {
                    type: 'VeridaDatabase',
                    endpointUri: 'https://db.testnet.verida.io:5001/'
                },
                defaultMessageServer: {
                    type: 'VeridaMessage',
                    endpointUri: 'https://db.testnet.verida.io:5001/'
                }
            },
            account
        })

        contexts[contextName] = context
        return contexts[contextName]
    }

    verifyRequestDomain(contextConfig, origin) {
        if (contextConfig.origin && contextConfig.origin == origin) {
            return true
        }

        if (!contextConfig.origin) {
            // Permit requests from all origins, if there is no origin specified
            return true
        }

        return false
    }

}

const sessionManager = new SessionManager()
export default sessionManager