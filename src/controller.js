import Verida from '@verida/datastore'

import dotenv from 'dotenv';
dotenv.config();

const veridaApp = new Verida({
    chain: process.env.CHAIN,
    address: process.env.ADDRESS,
    privateKey: process.env.PRIVATE_KEY,
    appName: 'Vault: Auth Server'
})

class Controller {

    constructor(app) {
        this.app = app
    }

    /**
     * Load a VID document from a VID
     * @param {*} req 
     * @param {*} res 
     */
    async request(req, res) {
        const EXPIRY_OFFSET = process.env.EXPIRY_OFFSET
        const AUTH_URI = process.env.AUTH_URI
        const now = Math.floor(Date.now() / 1000)
        const expiry = now / 1000.0 + EXPIRY_OFFSET

        const sessionId = 'hi'

        const data = {
            type: 'verida-wss-auth',
            session: sessionId,
            authUri: AUTH_URI
        }

        const didJwt = await veridaApp.user.createDidJwt(data, data, {
            expiry: expiry
        })

        return res.status(200).send({
            status: "success",
            data: didJwt
        });
    }

    /**
     * Load a VID document from a VID
     * @param {*} req 
     * @param {*} res 
     */
    async response(req, res) {
        return res.status(200).send({
            status: "success",
            data: {
                hello: "response"
            }
        });
    }

}

const controller = new Controller()
export default controller