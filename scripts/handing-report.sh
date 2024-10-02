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