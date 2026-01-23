#!/bin/bash

# Configuration Sync Script
# This script makes it easy to fetch latest balance changes and rebuild configs

set -e

echo "🎮 Configuration Generator - Sync Script"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from Configuration-Generator root directory"
    exit 1
fi

# Check for required environment variables
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    echo "   Copy .env.example to .env and configure it"
    exit 1
fi

# Parse command line arguments
COMMAND=${1:-"sync"}

case "$COMMAND" in
    "verify")
        echo "🔍 Verifying Google Sheets access..."
        bun run src/cli.ts verify
        echo ""
        echo "✅ Verification complete!"
        ;;
    
    "fetch")
        echo "📥 Fetching latest configuration from Google Sheets..."
        bun run src/cli.ts fetch
        echo ""
        echo "✅ Fetch complete! CSVs saved to config/csv/"
        ;;
    
    "build")
        echo "🔧 Compiling CSVs to TypeScript..."
        bun run src/cli.ts build
        echo ""
        echo "✅ Build complete! TypeScript modules in dist/generated/"
        ;;
    
    "sync")
        echo "🔄 Syncing: Fetch + Build..."
        echo ""
        
        echo "📥 Step 1/2: Fetching from Google Sheets..."
        bun run src/cli.ts fetch
        echo ""
        
        echo "🔧 Step 2/2: Compiling to TypeScript..."
        bun run src/cli.ts build
        echo ""
        
        echo "✅ Sync complete!"
        echo ""
        echo "📊 Generated files:"
        ls -lh dist/generated/*.ts | awk '{print "   - " $9 " (" $5 ")"}'
        ;;
    
    "test")
        echo "🧪 Running test suite..."
        bun test
        ;;
    
    "copy")
        TARGET_DIR=${2:-"../game/src/configs"}
        
        if [ ! -d "$TARGET_DIR" ]; then
            echo "❌ Error: Target directory not found: $TARGET_DIR"
            echo "   Usage: ./sync.sh copy <target-directory>"
            exit 1
        fi
        
        echo "📋 Copying generated files to $TARGET_DIR..."
        mkdir -p "$TARGET_DIR"
        cp dist/generated/*.ts "$TARGET_DIR/"
        
        echo "✅ Copied $(ls dist/generated/*.ts | wc -l) files"
        echo ""
        echo "📊 Files in target:"
        ls -lh "$TARGET_DIR"/*.ts | awk '{print "   - " $9 " (" $5 ")"}'
        ;;
    
    "help"|"--help"|"-h")
        echo "Usage: ./sync.sh [command] [options]"
        echo ""
        echo "Commands:"
        echo "  verify          Test Google Sheets credentials and access"
        echo "  fetch           Download latest data from Google Sheets to CSV"
        echo "  build           Compile CSVs to TypeScript modules"
        echo "  sync            Fetch + Build (default)"
        echo "  test            Run test suite"
        echo "  copy [dir]      Copy generated TS files to another directory"
        echo "  help            Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./sync.sh                           # Fetch and build"
        echo "  ./sync.sh verify                    # Test credentials"
        echo "  ./sync.sh copy ../game/src/configs  # Copy to game repo"
        echo ""
        echo "Environment:"
        echo "  Configure .env file with:"
        echo "  - GOOGLE_SERVICE_ACCOUNT_KEY_PATH"
        echo "  - GOOGLE_SHEETS_ID"
        ;;
    
    *)
        echo "❌ Unknown command: $COMMAND"
        echo "   Run './sync.sh help' for usage"
        exit 1
        ;;
esac

echo ""
echo "🎉 Done!"
