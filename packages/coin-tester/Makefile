build:
	npx lerna bootstrap --scope=@coolwallet/core --scope=@coolwallet/transport-jre-http --scope=@coolwallet/transport-web-ble
	npx lerna run build --scope=@coolwallet/core
	npx lerna run build --parallel --scope="@coolwallet/transport-jre-http" --scope=@coolwallet/transport-web-ble

build-vet:
	npx lerna run build --parallel --scope="@coolwallet/vet"
	npm run dev -- --force