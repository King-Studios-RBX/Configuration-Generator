#!/bin/bash
# Check for folder structure issues:
# 1. Folders with non-snake_case names
# 2. Folders with only a single index.ts/index.tsx file

set -e

ISSUES_FOUND=0

echo "🔍 Checking folder structure..."
echo ""

# Function to check if string is snake_case
is_snake_case() {
    echo "$1" | grep -qE '^[a-z0-9_]+$'
}

# Check for non-snake_case directory names
echo "📁 Checking directory naming (snake_case required)..."
BAD_DIRS=$(find src -type d | while read -r dir; do
    dirname=$(basename "$dir")
    
    # Skip root "src" and hidden directories
    if [ "$dirname" = "src" ] || [ "$dirname" = "." ] || [[ "$dirname" == .* ]]; then
        continue
    fi
    
    # Check if directory name is snake_case
    if ! is_snake_case "$dirname"; then
        echo "$dir"
    fi
done)

if [ -n "$BAD_DIRS" ]; then
    ISSUES_FOUND=1
    echo ""
    echo "❌ Found directories with non-snake_case names:"
    echo "$BAD_DIRS" | while read -r dir; do
        dirname=$(basename "$dir")
        # Suggest snake_case version
        suggested=$(echo "$dirname" | sed 's/\([A-Z]\)/_\L\1/g' | sed 's/^_//' | sed 's/__/_/g')
        echo "   $dir"
        echo "      → Suggested: ${dir%/*}/$suggested"
    done
    echo ""
else
    echo "✅ All directory names are snake_case"
    echo ""
fi

# Check for single-file folders (folders with ONLY index.ts/tsx and NO subdirectories)
echo "📂 Checking for unnecessary single-file folders..."
SINGLE_FILE_FOLDERS=$(find src -type d | while read -r dir; do
    # Count total files AND directories in directory (not recursive)
    file_count=$(find "$dir" -maxdepth 1 -type f | wc -l)
    dir_count=$(find "$dir" -maxdepth 1 -type d | wc -l)
    
    # Only flag if there's exactly 1 file and no subdirectories (dir_count=1 means only the dir itself)
    if [ "$file_count" -eq 1 ] && [ "$dir_count" -eq 1 ]; then
        index_file=$(find "$dir" -maxdepth 1 -name "index.ts" -o -name "index.tsx" | head -1)
        if [ -n "$index_file" ]; then
            # Skip auto-generated folders and top-level shared modules
            if [ "$dir" = "src/shared/configurations/towers" ] || [ "$dir" = "src/shared/events" ]; then
                continue
            fi
            echo "$dir|$index_file"
        fi
    fi
done)

if [ -n "$SINGLE_FILE_FOLDERS" ]; then
    ISSUES_FOUND=1
    echo ""
    echo "⚠️  Found folders with only a single index.ts/index.tsx file:"
    echo "   These should be flattened (move index.tsx content to parent as <folder_name>.tsx)"
    echo ""
    echo "$SINGLE_FILE_FOLDERS" | while IFS='|' read -r dir index_file; do
        dirname=$(basename "$dir")
        parent_dir=$(dirname "$dir")
        ext="${index_file##*.}"
        
        # Skip if parent is src root
        if [ "$parent_dir" = "src" ] || [ "$parent_dir" = "src/client" ] || [ "$parent_dir" = "src/server" ] || [ "$parent_dir" = "src/shared" ]; then
            continue
        fi
        
        # Skip auto-generated folders
        if [ "$dir" = "src/shared/configurations/towers" ]; then
            continue
        fi
        
        suggested_file="${parent_dir}/${dirname}.${ext}"
        
        echo "   $dir"
        echo "      Current:  $index_file"
        echo "      → Move to: $suggested_file"
        echo "      → Then delete folder: $dir"
        echo ""
    done
else
    echo "✅ No unnecessary single-file folders found"
    echo ""
fi

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ISSUES_FOUND -eq 0 ]; then
    echo "✅ All folder structure checks passed!"
else
    echo "❌ Folder structure issues found"
    echo ""
    echo "To fix these issues:"
    echo "  1. Rename directories to snake_case"
    echo "  2. Flatten single-file folders"
    echo "  3. Update imports in affected files"
    echo ""
    echo "Run this script to identify issues:"
    echo "  bun run check:folders"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exit $ISSUES_FOUND