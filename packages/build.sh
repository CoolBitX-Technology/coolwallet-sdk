set -e

cd core
npm link
npm run-script build
cd ..

cd cws-bnb
npm link @coolwallets/core
npm run-script build
cd ..

cd cws-btc
npm link @coolwallets/core
npm run-script build
cd ..

cd cws-eos
npm link @coolwallets/core
npm run-script build
cd ..

cd cws-eth
npm link @coolwallets/core
npm run-script build
cd ..

cd cws-icx
npm link @coolwallets/core
npm run-script build
cd ..

cd cws-wallet
npm link @coolwallets/core
npm run-script build
cd ..

cd cws-xlm
npm link @coolwallets/core
npm install
npm link @coolwallets/core
npm run-script build
cd ..

cd cws-xrp
npm link @coolwallets/core
npm run-script build
cd ..

cd transport-react-native-ble
npm link @coolwallets/core
npm install
npm link @coolwallets/core
npm run-script build
cd ..

cd transport-web-ble
npm link @coolwallets/core
npm install
npm link @coolwallets/core
npm run-script build
cd ..


