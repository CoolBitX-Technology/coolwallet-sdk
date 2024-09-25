TEST_FIXTURE_SCOPES="--scope @coolwallet/core --scope @coolwallet/testing-library --scope @coolwallet/transport-jre-http"
TEST_SCOPES=(
  --scope @coolwallet/core
  --scope @coolwallet/btc
  --scope @coolwallet/dot
  --scope @coolwallet/kas
  --scope @coolwallet/ton
  --scope @coolwallet/bsc
  --scope @coolwallet/evm
  --scope @coolwallet/eth
  --scope @coolwallet/sol
  --scope @coolwallet/ada
  --scope @coolwallet/terra
  --scope @coolwallet/cosmos
  --scope @coolwallet/xtz
  --scope @coolwallet/atom 
)
LERNA="npx lerna"

$LERNA bootstrap $TEST_FIXTURE_SCOPES
$LERNA run build $TEST_FIXTURE_SCOPES
$LERNA run test "${TEST_SCOPES[@]}" --concurrency 1