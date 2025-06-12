#!/bin/bash
# sh scripts/enhance_changelog.sh 

JSON_FILE="${1:-coolwallet_v2_tags.json}"
REPO="CoolBitX-Technology/coolwallet-sdk"
PACKAGES_DIR="packages"

gh api "repos/$REPO/tags?per_page=100" --paginate  --jq '[.[] | select(.name | test("^@coolwallet/[^@]+@2\\."))] | sort_by(.name)' > coolwallet_v2_tags.json

echo "正在處理 $JSON_FILE 並取得 PR 資訊..."

# 取得 commit 對應的 PR title 和編號
get_pr_title() {
    local commit_sha=$1
    local pr_info
    
    # 取得 PR title 和編號
    pr_info=$(gh api "repos/$REPO/commits/$commit_sha/pulls" --jq '.[0] | select(. != null) | "- " + .title + " (#" + (.number|tostring) + ")"' 2>/dev/null)
    
    # echo PR 資訊
    if [ -n "$pr_info" ] && [ "$pr_info" != "- null (#null)" ]; then
        echo "$pr_info"
    fi
}

# 使用 jq 處理 JSON 並按 package 和版本分組
jq -r '
# 按照 package 名稱分組 (取 @coolwallet/ 後面的部分)
group_by(.name | split("@")[1] | split("/")[1]) | 
.[] as $package_group |

# 取得 package 名稱 (只取最後的部分，如 zen, ada, core)
($package_group[0].name | split("@")[1] | split("/")[1]) as $package_name |

# 按照版本分組 (去掉 beta/alpha 後綴來分組)
($package_group | group_by(.name | split("@")[2] | split("-")[0])) as $version_groups |

# 為每個版本組生成輸出 coin-zen|2.1.0|@coolwallet/coin-zen@2.1.0:abc123,@coolwallet/coin-zen@2.1.0-beta.1:def456
($version_groups | reverse | .[] | 
  (.[0].name | split("@")[2] | split("-")[0]) as $base_version |
  $package_name + "|" + $base_version + "|" + ([.[] | .name + ":" + .commit.sha] | join(","))
)' "$JSON_FILE" | while IFS='|' read -r package_name version tag_commits; do
    
    if [ -n "$package_name" ] && [ -n "$version" ] && [ -n "$tag_commits" ]; then
        # 決定 package 資料夾名稱
        if [ "$package_name" = "core" ]; then
            package_dir="$PACKAGES_DIR/core"
        elif [ "$package_name" = "testing-library" ]; then
            package_dir="$PACKAGES_DIR/testing-library"
        elif [ "$package_name" = "transport-jre-http" ]; then
            package_dir="$PACKAGES_DIR/transport-jre-http"
        else
            package_dir="$PACKAGES_DIR/coin-$package_name"
        fi
        
        output_file="$package_dir/CHANGELOG.md"
        
        # 如果是新的 package，建立新檔案
        if [ ! -f "$output_file" ]; then
            echo "正在生成 $output_file..."
            echo "# Changelog" > "$output_file"
            echo "" >> "$output_file"
        fi
        
        echo "" >> "$output_file"
        echo "## $version" >> "$output_file"
        
        # 處理這個版本的所有 commits
        echo "$tag_commits" | tr ',' '\n' | while IFS=':' read -r tag_name commit_sha; do
            if [ -n "$commit_sha" ]; then
                echo "正在處理 $tag_name..."
                pr_line=$(get_pr_title "$commit_sha")
                if [ -n "$pr_line" ]; then
                    echo "$pr_line" >> "$output_file"
                fi
            fi
        done 
    fi
done

wait

echo ""
echo "✅ Changelog 生成完成！"
echo ""
