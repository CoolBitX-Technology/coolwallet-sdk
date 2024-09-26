TEST_FIXTURE_SCOPES="--scope @coolwallet/core --scope @coolwallet/testing-library --scope @coolwallet/transport-jre-http"
TEST_SCOPES=(
  @coolwallet/core
  @coolwallet/btc
  @coolwallet/dot
  @coolwallet/kas
  @coolwallet/ton
  @coolwallet/bsc
  @coolwallet/evm
  @coolwallet/eth
  # --scope @coolwallet/sol # TODO: fix test cases
  @coolwallet/ada
  @coolwallet/terra
  @coolwallet/cosmos
  @coolwallet/xtz
  @coolwallet/atom
)
LERNA="npx lerna"

$LERNA bootstrap $TEST_FIXTURE_SCOPES
$LERNA run build $TEST_FIXTURE_SCOPES

# 移除之前的測試報告
rm -rf scripts/reports scripts/allure-report

# 執行測試
for scope in "${TEST_SCOPES[@]}"; do
  echo "Running tests for --scope $scope..."
  $LERNA run ci-test-report --scope $scope --concurrency 1 || echo "Tests failed for $scope, continuing to next package."
done

# 建立測試報告目錄
mkdir -p scripts/reports/junit

# 移動測試報告
for dir in packages/coin-* packages/core; do
  if [ -d "$dir" ] && [ -f "$dir/junit.xml" ]; then
    coin_name=$(basename "$dir")
    sed 's/&quot;/"/g' "$dir/junit.xml" > "scripts/reports/junit/${coin_name}-junit.xml" || echo "Failed to process $dir/junit.xml"
  fi
done

# 移除所有 junit.xml 文件
find packages -type f -name 'junit.xml' -exec rm -f {} +

# 產生 Allure report 
allure generate ./scripts/reports/junit --clean -o ./scripts/allure-report

# open Allure report
allure open ./scripts/allure-report