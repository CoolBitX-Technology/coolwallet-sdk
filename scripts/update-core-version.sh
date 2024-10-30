#!/bin/sh

# sh scripts/update-core-version.sh     

# 將 npm info 輸出到 JSON 文件
npm info @coolwallet/core --json > package-info.json

time_data=$(grep -o '"1\.[0-9]\+\.[0-9]\+[^"]*": "[^"]*"' package-info.json)

# 確認 time_data 是否有內容
if [ -z "$time_data" ]; then
    echo "No versions found in time_data."
    exit 1
fi

echo "Time data:"
echo "$time_data"

# 提取所有版本和時間，並按時間排序，取出最新的版本
latest_version=$(echo "$time_data" | grep -o '"1\.[0-9]\+\.[0-9][^"]*": "[^"]*"' | sort -t '"' -k 4,4r | head -n 1)
echo "latest_version: $latest_version" 

# 輸出最新版本
if [ -n "$latest_version" ]; then
    final_version=$(echo "$latest_version" | sed 's/":.*//;s/"//g')
    echo "Latest version: $final_version"
else
    echo "No version found."
fi

# 組出要執行的 command
command="npm install @coolwallet/core@$final_version --save-peer"
echo "command: $command"

IGNORE_SCOPES=(
  --ignore @coolwallet/core
  --ignore @coolwallet/transport-react-native-ble
  --ignore tester
  --ignore @coolwallet/testing-library
  --ignore @coolwallet/template
)
# 執行 lerna command
npx lerna exec "${IGNORE_SCOPES[@]}" -- "$command"
