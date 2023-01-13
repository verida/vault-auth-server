const CONFIG = {
    VERIDA_ENVIRONMENT: 'testnet',
    // How many seconds an auth request should be valid
    EXPIRY_OFFSET: 90,
    // Update to be the public URL of this server
    AUTH_URI: 'ws://localhost:7001',
    // Port this server runs on
    PORT: 7001,
    CONTEXTS: {
        // Private keys and trusted domains for each context a user logs into
        // Typically you will have a single context for your application
        'Verida: Auth Server': {
            // Private key used to sign the auth tokens
            privateKey: '0x28d996ddda2f5131fb7567815c3df91c663b02d276d18c111017817319c370c8',
            // Trusted domain associated with this context
            loginDomain: 'https://localhost:8080'
        },
        'Verida: Auth client demo': {
            privateKey: '0x27d996ddda2f5131fb7567815c3df91c663b02d276d18c111017817319c370c8',
            loginDomain: 'https://localhost:8080'
        }
    },
    DEFAULT_CONTEXT: 'Verida: Auth Server'
}

export default CONFIG