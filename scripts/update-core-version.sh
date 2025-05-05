#!/bin/sh

# sh scripts/update-core-version.sh
 
IGNORE_SCOPES=(
   --ignore @coolwallet/core
   --ignore @coolwallet/transport-react-native-ble
   --ignore tester
   --ignore @coolwallet/testing-library
   --ignore @coolwallet/template
   --ignore @coolwallet/avaxc
   --ignore @coolwallet/bnb
   --ignore @coolwallet/near
   --ignore @coolwallet/theta
   --ignore @coolwallet/vet
   --ignore @coolwallet/cosmos
   --ignore @coolwallet/cronos
   --ignore @coolwallet/iotx
   --ignore @coolwallet/transport-web-ble
)

# 將 npm info 輸出到 JSON 文件
npx lerna list --json > package-info.json

# 目前 core 最新版本
core_latest_version=$(grep '"@coolwallet/core"' package-info.json -A 3 | grep '"version"' | sed 's/.*: "\(.*\)".*/\1/')
core_latest_version="^$core_latest_version"
echo "core_latest_version: $core_latest_version" 

# 讀取 package-info.json 的內容
json_content=$(cat package-info.json)

# 拿到各個幣種 name 和 version
names=$(echo "$json_content" | grep -o '"name": *"[^"]*"' | awk -F'"' '{print $4}')
versions=$(echo "$json_content" | grep -o '"version": *"[^"]*"' | awk -F'"' '{print $4}')

# 將 name 和 version 轉換為陣列
names_array=($names)
versions_array=($versions)

# 確保兩個陣列的長度相同
if [ ${#names_array[@]} -ne ${#versions_array[@]} ]; then
  echo "Error: The number of names and versions do not match."
  exit 1
fi

# 迭代每個 name 和 version，執行 npm show 這邊主要要判斷是否需要更新各幣種版本，如果不需要會忽略這個 package
for i in "${!names_array[@]}"; do
  name=${names_array[$i]}
  version=${versions_array[$i]}
  dependencies=$(npm show "$name@$version" dependencies --json)

  # 提取 @coolwallet/core 的版本
  core_version=$(echo "$dependencies" | grep -o '"@coolwallet/core": "[^"]*"' | sed 's/.*: "//; s/"$//')

  if [ -z "$core_version" ]; then
   echo "No dependencies found for $name@$version."
  else
   echo "Dependencies for $name@$version:"
   echo "$core_version"

   if [ "$core_latest_version" = "$core_version" ]; then
     IGNORE_SCOPES+=("--ignore" "$name")
    fi
  fi
done

# # 組出要執行的 command
 command="npm install @coolwallet/core@$core_latest_version --save"
 echo "command: $command"

# # 執行 lerna command
echo "IGNORE_SCOPES: ${IGNORE_SCOPES[@]}"
npx lerna exec  "${IGNORE_SCOPES[@]}" -- "$command" 

# 等到 2.x 回 master 再加上 version patch 邏輯
# && \
npx lerna exec  "${IGNORE_SCOPES[@]}" -- npm version patch
