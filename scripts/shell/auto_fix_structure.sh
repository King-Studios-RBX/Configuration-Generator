#!/usr/bin/env bash
set -euo pipefail

# Automatic folder structure and import fixer
# Runs silently and fixes issues automatically before commit

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE=$(mktemp)

# Capture output for logging
exec 3>&1 4>&2
exec 1>"$LOG_FILE" 2>&1

cleanup() {
    # Restore output
    exec 1>&3 2>&4
    rm -f "$LOG_FILE"
}
trap cleanup EXIT

# Function to convert to snake_case
to_snake_case() {
    echo "$1" | sed 's/\([A-Z]\)/_\L\1/g' | sed 's/^_//' | sed 's/__/_/g'
}

# Function to check if string is snake_case
is_snake_case() {
    echo "$1" | grep -qE '^[a-z0-9_]+$'
}

# Track if any changes were made
CHANGES_MADE=0
RENAME_LOG=$(mktemp)

# Step 1: Rename directories to snake_case (bottom-up)
find src -depth -type d 2>/dev/null | while read -r dir; do
    dirname=$(basename "$dir")
    
    # Skip special directories
    if [ "$dirname" = "src" ] || [ "$dirname" = "." ] || [[ "$dirname" == .* ]]; then
        continue
    fi
    
    if ! is_snake_case "$dirname"; then
        suggested=$(to_snake_case "$dirname")
        parent_dir=$(dirname "$dir")
        new_dir="${parent_dir}/${suggested}"
        
        if [ "$dirname" != "$suggested" ] && [ ! -e "$new_dir" ]; then
            echo "$dir|$new_dir" >> "$RENAME_LOG"
            mv "$dir" "$new_dir" 2>/dev/null || true
            CHANGES_MADE=1
        fi
    fi
done

# Step 2: Flatten single-file folders (bottom-up)
find src -depth -type d 2>/dev/null | while read -r dir; do
    file_count=$(find "$dir" -maxdepth 1 -type f 2>/dev/null | wc -l)
    dir_count=$(find "$dir" -maxdepth 1 -type d 2>/dev/null | wc -l)
    
    if [ "$file_count" -eq 1 ] && [ "$dir_count" -eq 1 ]; then
        index_file=$(find "$dir" -maxdepth 1 \( -name "index.ts" -o -name "index.tsx" \) 2>/dev/null | head -1)
        
        if [ -n "$index_file" ]; then
            dirname=$(basename "$dir")
            parent_dir=$(dirname "$dir")
            ext="${index_file##*.}"
            
            # Skip src root directories and known module folders
            if [ "$parent_dir" = "src" ] || [ "$parent_dir" = "src/client" ] || [ "$parent_dir" = "src/server" ] || [ "$parent_dir" = "src/shared" ] || [ "$dir" = "src/shared/events" ] || [ "$dir" = "src/shared/configurations/towers" ]; then
                continue
            fi
            
            new_file="${parent_dir}/${dirname}.${ext}"
            
            echo "$index_file|$new_file" >> "$RENAME_LOG"
            mv "$index_file" "$new_file" 2>/dev/null || true
            rmdir "$dir" 2>/dev/null || true
            CHANGES_MADE=1
        fi
    fi
done

# Step 3: Update imports if changes were made
if [ $CHANGES_MADE -eq 1 ] && [ -s "$RENAME_LOG" ]; then
    # Build path mapping
    declare -A PATH_RENAMES
    while IFS='|' read -r old new; do
        if [ -n "$old" ] && [ -n "$new" ]; then
            old_import=$(echo "$old" | sed 's|^src/||' | sed 's|/index\.tsx\?$||' | sed 's|\.tsx\?$||')
            new_import=$(echo "$new" | sed 's|^src/||' | sed 's|\.tsx\?$||')
            PATH_RENAMES["$old_import"]="$new_import"
        fi
    done < "$RENAME_LOG"
    
    # Update all TypeScript files
    find src -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | while read -r file; do
        for old_path in "${!PATH_RENAMES[@]}"; do
            new_path="${PATH_RENAMES[$old_path]}"
            
            if [ "$old_path" != "$new_path" ]; then
                # Extract just the changed segment for precise replacement
                old_segment=$(basename "$old_path")
                new_segment=$(basename "$new_path")
                
                if [ "$old_segment" != "$new_segment" ]; then
                    # Update imports - handle both relative and alias imports
                    sed -i "s|from \([\"']\)\(.*[/]\)\{0,1\}${old_segment}\([\"']\)|from \1\2${new_segment}\3|g" "$file" 2>/dev/null || true
                fi
            fi
        done
    done
    
    # Stage the fixed files
    git add src/ 2>/dev/null || true
fi

rm -f "$RENAME_LOG"

# If changes were made, output a success message to stderr (visible to user)
if [ $CHANGES_MADE -eq 1 ]; then
    echo "✅ Auto-fixed folder structure and imports" >&3
fi

exit 0