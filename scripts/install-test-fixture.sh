#!/bin/bash

TEST_FIXTURE_SCOPES=(
  --scope @coolwallet/core
  --scope @coolwallet/testing-library
  --scope @coolwallet/transport-jre-http
)

LERNA="npx lerna"

$LERNA bootstrap "${TEST_FIXTURE_SCOPES[@]}"
$LERNA run build "${TEST_FIXTURE_SCOPES[@]}"
