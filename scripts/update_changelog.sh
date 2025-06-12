#!/bin/bash
# sh scripts/update_changelog.sh @coolwallet/ada@2.0.0

set -e

TAG_NAME="$1"
REPO="${GITHUB_REPOSITORY:-CoolBitX-Technology/coolwallet-sdk}"

echo "🏷️ 處理 tag: $TAG_NAME"

# 驗證格式並解析
if [[ ! "$TAG_NAME" =~ ^@coolwallet/(.+)@(.+)$ ]]; then
    echo "❌ tag 格式錯誤"
    exit 1
fi

package_name="${BASH_REMATCH[1]}"
version="${BASH_REMATCH[2]}"
base_version="${version%%-*}"

echo "📦 $package_name | 🔖 $version → $base_version"

# 決定目錄
[ -d "packages/$package_name" ] && package_dir="packages/$package_name" || package_dir="packages/coin-$package_name"
changelog_file="$package_dir/CHANGELOG.md"

echo "📁 $package_dir"

# 取得 commit SHA 和 PR 資訊
echo "TAG_NAME: $TAG_NAME"
commit_sha=$(git rev-list -n 1 "$TAG_NAME")
pr_line=$(gh api "repos/$REPO/commits/$commit_sha/pulls" --jq '.[0] | select(. != null) | "- " + .title + " (#" + (.number|tostring) + ")"' 2>/dev/null)
echo "📝 $pr_line"

# 檢查是否重複
if [ -f "$changelog_file" ] && [[ "$pr_line" =~ \(#([0-9]+)\) ]] && grep -q "(#${BASH_REMATCH[1]})" "$changelog_file"; then
    echo "⚠️ PR 已存在，跳過"
    exit 0
fi

# 建立目錄
mkdir -p "$package_dir"

# 更新 changelog
if [ ! -f "$changelog_file" ]; then
    # 新檔案
    cat > "$changelog_file" << EOF
# Changelog

## $base_version
$pr_line

EOF
    echo "✅ 建立新 changelog"
elif grep -q "^## $base_version$" "$changelog_file"; then
    # 版本已存在
    awk -v base_version="$base_version" -v pr_line="$pr_line" '
        /^## / && $0 == "## " base_version { found=1; print; next }
        found && /^- / && !inserted { print pr_line; inserted=1 }
        found && /^## / && $0 != "## " base_version && !inserted { print pr_line; inserted=1; found=0 }
        { print }
        END { if(found && !inserted) print pr_line }
    ' "$changelog_file" > "$changelog_file.tmp" && mv "$changelog_file.tmp" "$changelog_file"
else
    # 新版本
    {
        head -n 2 "$changelog_file"
        echo "## $base_version"
        echo "$pr_line"
        echo ""
        tail -n +3 "$changelog_file"
    } > "$changelog_file.tmp" && mv "$changelog_file.tmp" "$changelog_file"
    echo "✅ 新增版本 $base_version"
fi