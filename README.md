
# Vault Auth Server

A web socket server that bridges connections between a mobile device and a web page to enable secure, single sign on using private blockchain keys stored on the mobile device.

## Usage

```
npm run start
```

## Configuration

You must configure each application this server will support by editing the `config/index.js` file.

The object key corresponds to the application name and the object properties correspond to the private key being used ot sign authentication requests and the domain name initiating the sign on request.