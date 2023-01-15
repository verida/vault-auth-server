#!/bin/sh
#
# Script to run the auth server using PM2 that will auto-restart and provide monitoring information
# More details here: https://pm2.keymetrics.io/docs/usage/process-management/
#
# Install with:
# yarn global add pm2
#

~/.yarn/bin/pm2 start dist/server.js --name vault-auth-server