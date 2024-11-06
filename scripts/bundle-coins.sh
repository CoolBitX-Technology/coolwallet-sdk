#!/bin/bash
TEST_FIXTURE_SCOPES=(
  --scope @coolwallet/eth
  --scope @coolwallet/evm
  --scope @coolwallet/sol
)

LERNA="npx lerna"

$LERNA bootstrap "${TEST_FIXTURE_SCOPES[@]}"
$LERNA run build "${TEST_FIXTURE_SCOPES[@]}"

# Delete node_modules for specific packages
$LERNA exec "${TEST_FIXTURE_SCOPES[@]}" -- rm -rf node_modules
