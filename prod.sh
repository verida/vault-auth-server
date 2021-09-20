#!/bin/sh
#
# Script to run the auth server using PM2 that will auto-restart and provide monitoring information
# More details here: https://pm2.keymetrics.io/docs/usage/process-management/
#
# Install with:
# yarn global add pm2
#

~/.yarn/bin/pm2 start ~/.nvm/versions/node/v12.14.1/bin/yarn --name vault-auth-server -- serve