TEST_FIXTURE_SCOPES="--scope @coolwallet/core --scope @coolwallet/testing-library --scope @coolwallet/transport-jre-http"
TEST_SCOPES=(
  --scope @coolwallet/core
  --scope @coolwallet/btc
  --scope @coolwallet/bch
  --scope @coolwallet/dot
  --scope @coolwallet/kas
  --scope @coolwallet/ton
  --scope @coolwallet/bsc
  --scope @coolwallet/evm
  --scope @coolwallet/eth
  # --scope @coolwallet/sol # TODO: fix test cases
  --scope @coolwallet/ada
  --scope @coolwallet/terra
  --scope @coolwallet/cosmos
  --scope @coolwallet/xtz
  --scope @coolwallet/atom
)
LERNA="npx lerna"

$LERNA bootstrap $TEST_FIXTURE_SCOPES
$LERNA run build $TEST_FIXTURE_SCOPES
$LERNA bootstrap "${TEST_SCOPES[@]}"

# 移除之前的測試報告
rm -rf scripts/reports scripts/allure-report

# 執行測試
$LERNA run ci-test-report "${TEST_SCOPES[@]}" --concurrency 1 --no-bail || echo "run tests completed"

# 建立測試報告目錄
mkdir -p scripts/reports/junit

# 移動測試報告
for dir in packages/coin-* packages/core; do
  if [ -d "$dir" ] && [ -f "$dir/junit.xml" ]; then
    coin_name=$(basename "$dir")
    sed 's/&quot;/"/g' "$dir/junit.xml" >"scripts/reports/junit/${coin_name}-junit.xml" || echo "Failed to process $dir/junit.xml"
  fi
done

# 移除所有 junit.xml 文件
find packages -type f -name 'junit.xml' -exec rm -f {} +

# 產生 Allure report
npx allure generate ./scripts/reports/junit --clean -o ./scripts/allure-report

# open Allure report
npx allure open ./scripts/allure-report
