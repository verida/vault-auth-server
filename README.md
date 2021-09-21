
# Vault Auth Server

A web socket server that bridges connections between a mobile device and a web page to enable secure, single sign on using private blockchain keys stored on the mobile device.

## Usage

```
npm run start
```

## Configuration

Update `.env` / `AUTH_URI` to match the domain name / IP address of this server. You will also need to configure the Auth Client library to use this value as the `serverUri`.

You must configure each application this server will support by editing the `config/index.js` file.

The object key corresponds to the application name and the object properties correspond to the private key being used ot sign authentication requests and the domain name initiating the sign on request.

# Security

The configuration file allows you to provide the private key of a valid blockchain account that can sign messages relating to the login process.

There is a `loginOrigin` property that, if specified, will check the `origin` HTTP header from each socket request to ensure it's coming from the expected domain. This ensures third party websites can't easily request valid authentication tokens. This also ensures third party websites can be prevented from using the resources of any auth server that is running.

Malicious third parties could obtain a token by spoofing the `origin` HTTP header and then presenting that to the user. However, this `loginOrigin` property is passed inside the encrypted payload to the Verida Vault and is displayed to the user. This allows the user to visually verify the domain name they are currently on matches the domain name displayed on the Verida Vault login screen. In the future, the Verida Trust Framework will add an additional layer of security by matching on chain metadata against the public key and domain name used to sign the payload.

# Production

We recommend using [PM2](https://www.npmjs.com/package/pm2) package to manage running the server.

Starting the server:

```
$ cd <vault-auth-server-location>
$ pm2 start ~/.nvm/versions/node/v12.14.1/bin/yarn --name vault-auth-server -- serve
```

Restarting the server:

```
$ pm2 restart vault-auth-server -- serve
```

Stopping the server:

```
$ pm2 stop vault-auth-server -- serve
```

Monitoring the server:

```
$ pm2 monit
```

