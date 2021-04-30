set -e

npm install
npm link @coolwallet/core
npm run-script build
npm link