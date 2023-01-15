const CONFIG = {
    VERIDA_ENVIRONMENT: 'testnet',
    // How many seconds an auth request should be valid
    EXPIRY_OFFSET: 90,
    // The publicly exposed Websocker Server URL of this server
    // Use `wss://` for secure connections
    AUTH_URI: 'ws://localhost:7001',
    // Port this server runs on
    PORT: 7001,
    CONTEXTS: {
        // Private keys and trusted domains for each context a user logs into
        // Typically you will have a single context for your application
        'Verida: Auth Server': {
            // Private key used to sign the auth tokens
            privateKey: '0x28d996ddda2f5131fb7567815c3df91c663b02d276d18c111017817319c370c8',
        },
        'Verida: Auth client demo': {
            privateKey: '0x27d996ddda2f5131fb7567815c3df91c663b02d276d18c111017817319c370c8',
        }
    },
    // Optional default context that will be used if unknown context specified
    // This effectively enable a catch-all so that the auth server will support requests
    // for any context and will sign using this default context
    DEFAULT_CONTEXT: 'Verida: Auth Server',
    DID_CLIENT_CONFIG: {
        callType: 'web3',
        web3Config: {
            // Private blockchain key that has sufficient tokens to submit transactions
            // to create new DID for this server (if DID not already exist)
            privateKey: '',
            rpcUrl: 'https://rpc-mumbai.maticvigil.com/'
        },
        // Storage node endpoints to store the DID document for this node
        // (if DID not already exist)
        didEndpoints: [
            'https://node1-apse2.devnet.verida.tech/did/',
            'https://node2-apse2.devnet.verida.tech/did/',
            'https://node3-apse2.devnet.verida.tech/did/'
        ]
    }
}

export default CONFIG