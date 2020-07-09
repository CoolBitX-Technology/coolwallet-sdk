set -e

cd core
npm link
npm run-script build
cd ..

cd cws-bnb
npm link @coolwallet/core
npm install
npm link
npm run-script build
cd ..

cd cws-btc
npm link @coolwallet/core
npm link
npm run-script build
cd ..

cd cws-eos
npm link @coolwallet/core
npm install
npm link
npm run-script build
cd ..

cd cws-eth
npm link @coolwallet/core
npm link
npm run-script build
cd ..

cd cws-icx
npm link @coolwallet/core
npm link
npm run-script build
cd ..

cd cws-xlm
npm link @coolwallet/core
npm install
npm link @coolwallet/core
npm link
npm run-script build
cd ..

cd cws-xrp
npm link @coolwallet/core
npm link
npm run-script build
cd ..

cd transport-react-native-ble
npm link @coolwallet/core
npm install
npm link @coolwallet/core
npm link
npm run-script build
cd ..

cd transport-web-ble
npm link @coolwallet/core
npm install
npm link @coolwallet/core
npm link
npm run-script build
cd ..


