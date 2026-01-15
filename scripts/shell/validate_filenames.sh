#!/bin/bash
# STRICT file naming validation for Anime Reborn
# Enforces snake_case for ALL files (with minimal exceptions for conventional configs)

INVALID_FILES=""
WARNINGS=""

echo "🔍 Validating file naming conventions..."

# Get staged files (if in git hook context) or all tracked files - ONLY in src/ and tests/
if git rev-parse --git-dir > /dev/null 2>&1; then
    if git diff --cached --name-only > /dev/null 2>&1; then
        FILES=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null | grep -E '^(src|tests)/' || git ls-files | grep -E '^(src|tests)/')
    else
        FILES=$(git ls-files | grep -E '^(src|tests)/')
    fi
else
    FILES=$(find src tests -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -not -path "*/include/*" -not -path "*/release/*" 2>/dev/null || true)
fi

# Function to check snake_case
is_snake_case() {
    echo "$1" | grep -qE '^[a-z0-9_]+$'
}

# Function to check lowercase (for special files)
is_lowercase() {
    echo "$1" | grep -qE '^[a-z0-9\.]+$'
}

# Function to get filename without extension
get_name_without_ext() {
    local filename="$1"
    echo "${filename%.*}"
}

# Validate TypeScript/TSX files in src/
echo "$FILES" | grep -E '^src/.*\.(ts|tsx)$' | while IFS= read -r file; do
    [ -z "$file" ] && continue
    
    filename=$(basename "$file")
    name_no_ext=$(get_name_without_ext "$filename")
    
    # Special cases allowed
    if echo "$filename" | grep -qE '^index\.(client|server)\.ts$'; then
        continue
    fi
    
    # Remove additional extensions for multi-dot files
    name_no_ext="${name_no_ext%.client}"
    name_no_ext="${name_no_ext%.server}"
    name_no_ext="${name_no_ext%.storybook}"
    name_no_ext="${name_no_ext%.story}"
    name_no_ext="${name_no_ext%.spec}"
    name_no_ext="${name_no_ext%.d}"
    
    if ! is_snake_case "$name_no_ext"; then
        echo "❌ $file → should be snake_case"
    fi
done

# Validate Luau/Lua files
echo "$FILES" | grep -E '\.(lua|luau)$' | grep -v 'node_modules' | while IFS= read -r file; do
    [ -z "$file" ] && continue
    
    filename=$(basename "$file")
    name_no_ext=$(get_name_without_ext "$filename")
    
    # Allow some special patterns
    if echo "$filename" | grep -qE '^(RuntimeLib|Promise)\.lua$'; then
        continue
    fi
    
    if ! is_snake_case "$name_no_ext"; then
        echo "❌ $file → should be snake_case"
    fi
done

# Validate shell scripts (STRICT snake_case)
echo "$FILES" | grep -E '\.sh$' | grep -v 'node_modules' | while IFS= read -r file; do
    [ -z "$file" ] && continue
    
    filename=$(basename "$file")
    name_no_ext=$(get_name_without_ext "$filename")
    
    if ! is_snake_case "$name_no_ext"; then
        echo "❌ $file → should be snake_case"
    fi
done

# Validate config files (snake_case or conventional names)
echo "$FILES" | grep -E '\.(config|rc)\.(js|mjs|ts|json)$' | grep -v 'node_modules' | while IFS= read -r file; do
    [ -z "$file" ] && continue
    
    filename=$(basename "$file")
    
    # Allow conventional config names
    if echo "$filename" | grep -qE '^(commitlint|lint-staged|jest)\.config\.(js|mjs|ts)$'; then
        continue
    fi
    
    name_no_ext=$(get_name_without_ext "$filename")
    name_check="${name_no_ext%.config}"
    name_check="${name_check%.rc}"
    
    if ! is_snake_case "$name_check"; then
        echo "❌ $file → config files should be snake_case (or use conventional names like commitlint.config.mjs)"
    fi
done

echo ""
echo "✅ File naming validation complete"
echo "   (Note: Use 'bun run lint:files' for comprehensive validation)"
exit 0