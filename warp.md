# Warp AI Integration Guide for Stratosphere Mobile

This document contains Warp AI rules and workflows for developing the Stratosphere Mobile React Native application.

## Warp AI Rules

### Auto-Commit Rule with Change Logging
After every AI prompt that results in code changes or file modifications, automatically commit the changes to git with a descriptive commit message AND update the changes.md file with verbose details about what was modified.

```bash
# Rule: Auto-commit after AI assistance with detailed change logging
# This rule ensures that all AI-generated code changes are properly tracked in version control
# and documented in the changes.md file with comprehensive details

auto_commit_with_logging() {
  if [[ -n $(git status --porcelain) ]]; then
    echo "🤖 AI made changes - analyzing and committing..."
    
    # Get current timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    iso_timestamp=$(date '+%Y-%m-%dT%H:%M:%SZ')
    
    # Analyze changed files
    git add .
    changed_files=$(git diff --name-only --cached)
    modified_files=$(git diff --name-only --cached --diff-filter=M)
    added_files=$(git diff --name-only --cached --diff-filter=A)
    deleted_files=$(git diff --name-only --cached --diff-filter=D)
    
    # Determine commit type based on file changes
    commit_type="chore"
    if [[ $changed_files == *".tsx"* ]] || [[ $changed_files == *".ts"* ]]; then
      commit_type="feat"
    elif [[ $changed_files == *"package.json"* ]]; then
      commit_type="deps"
    elif [[ $changed_files == *".md"* ]] && [[ $changed_files != *"changes.md"* ]]; then
      commit_type="docs"
    elif [[ $changed_files == *"test"* ]] || [[ $changed_files == *"spec"* ]]; then
      commit_type="test"
    elif [[ $changed_files == *"config"* ]] || [[ $changed_files == *".json"* ]]; then
      commit_type="config"
    fi
    
    # Generate commit message
    commit_msg="$commit_type: AI-assisted changes - $timestamp"
    
    # Create detailed change entry for changes.md
    change_entry="\n---\n\n## $timestamp - AI-Assisted Changes\n\n### Commit: \`$(git rev-parse --short HEAD 2>/dev/null || echo 'pending')\`\n### Type: \`$commit_type\`\n"
    
    # Add file change details
    if [[ -n $added_files ]]; then
      change_entry+="### Files Added:\n"
      for file in $added_files; do
        change_entry+="- \`$file\` - $(get_file_description "$file")\n"
      done
      change_entry+="\n"
    fi
    
    if [[ -n $modified_files ]]; then
      change_entry+="### Files Modified:\n"
      for file in $modified_files; do
        change_entry+="- \`$file\` - $(get_file_description "$file")\n"
      done
      change_entry+="\n"
    fi
    
    if [[ -n $deleted_files ]]; then
      change_entry+="### Files Deleted:\n"
      for file in $deleted_files; do
        change_entry+="- \`$file\`\n"
      done
      change_entry+="\n"
    fi
    
    # Add change statistics
    total_additions=$(git diff --cached --numstat | awk '{sum += $1} END {print sum+0}')
    total_deletions=$(git diff --cached --numstat | awk '{sum += $2} END {print sum+0}')
    files_changed=$(echo "$changed_files" | wc -l | xargs)
    
    change_entry+="### Change Statistics:\n"
    change_entry+="- **Files Changed**: $files_changed\n"
    change_entry+="- **Lines Added**: $total_additions\n"
    change_entry+="- **Lines Deleted**: $total_deletions\n"
    change_entry+="- **Net Change**: $((total_additions - total_deletions)) lines\n\n"
    
    # Get git diff summary for context
    change_entry+="### Description:\n"
    change_entry+="AI-assisted modifications made on $timestamp. Changes include:\n\n"
    
    # Add file-by-file analysis
    for file in $changed_files; do
      if [[ $file != "changes.md" ]]; then
        change_entry+="**$file**: $(analyze_file_changes "$file")\n"
      fi
    done
    
    change_entry+="\n### Impact:\n"
    change_entry+="$(generate_impact_assessment "$changed_files" "$commit_type")\n"
    
    # Update changes.md (insert after the format section)
    if [[ -f "changes.md" ]]; then
      # Create temp file with new entry
      temp_file=$(mktemp)
      # Find the line number after "---" following the format section
      line_num=$(grep -n "^---$" changes.md | head -1 | cut -d: -f1)
      if [[ -n $line_num ]]; then
        # Insert new entry after the first separator
        head -n $line_num changes.md > "$temp_file"
        echo -e "$change_entry" >> "$temp_file"
        tail -n +$((line_num + 1)) changes.md >> "$temp_file"
        mv "$temp_file" changes.md
      else
        # If no separator found, append to end
        echo -e "$change_entry" >> changes.md
      fi
    fi
    
    # Commit all changes including updated changes.md
    git add changes.md
    git commit -m "$commit_msg"
    
    echo "✅ Changes committed: $commit_msg"
    echo "📝 Updated changes.md with detailed change log"
    echo "📊 Statistics: $files_changed files, +$total_additions/-$total_deletions lines"
  else
    echo "ℹ️  No changes to commit"
  fi
}

# Helper function to describe file purpose
get_file_description() {
  local file=$1
  case $file in
    *.tsx) echo "React TypeScript component" ;;
    *.ts) echo "TypeScript module/service" ;;
    *.json) echo "Configuration/data file" ;;
    *.md) echo "Documentation file" ;;
    *.js) echo "JavaScript module" ;;
    *.css) echo "Stylesheet" ;;
    *.yaml|*.yml) echo "Configuration file" ;;
    package.json) echo "Project dependencies and scripts" ;;
    tsconfig.json) echo "TypeScript configuration" ;;
    *config*) echo "Configuration file" ;;
    *) echo "Project file" ;;
  esac
}

# Helper function to analyze specific file changes
analyze_file_changes() {
  local file=$1
  if [[ -f "$file" ]]; then
    case $file in
      *.tsx|*.ts)
        if git diff --cached "$file" | grep -q "^+.*function\|^+.*const\|^+.*class"; then
          echo "Added new functions/components/classes"
        elif git diff --cached "$file" | grep -q "^+.*import"; then
          echo "Added new imports/dependencies"
        else
          echo "Modified existing code structure"
        fi
        ;;
      *.json)
        if [[ $file == "package.json" ]]; then
          if git diff --cached "$file" | grep -q "dependencies\|devDependencies"; then
            echo "Updated project dependencies"
          else
            echo "Modified project configuration"
          fi
        else
          echo "Updated configuration settings"
        fi
        ;;
      *.md)
        echo "Updated documentation content"
        ;;
      *)
        echo "Modified file content"
        ;;
    esac
  else
    echo "New file added to project"
  fi
}

# Helper function to generate impact assessment
generate_impact_assessment() {
  local files=$1
  local type=$2
  local impacts=()
  
  case $type in
    "feat")
      impacts+=("✅ New functionality added to the application")
      if [[ $files == *"Screen"* ]]; then
        impacts+=("✅ User interface enhanced with new screens")
      fi
      if [[ $files == *"Component"* ]]; then
        impacts+=("✅ Reusable UI components created/improved")
      fi
      if [[ $files == *"Service"* ]]; then
        impacts+=("✅ Backend services and integrations enhanced")
      fi
      ;;
    "docs")
      impacts+=("✅ Documentation improved for better developer experience")
      impacts+=("✅ Project understanding and maintainability enhanced")
      ;;
    "deps")
      impacts+=("✅ Project dependencies updated")
      impacts+=("⚠️  May require npm install to sync dependencies")
      ;;
    "config")
      impacts+=("✅ Build and development configuration optimized")
      impacts+=("✅ Developer experience improved")
      ;;
    *)
      impacts+=("✅ Project maintenance and improvements applied")
      ;;
  esac
  
  # Add file-specific impacts
  if [[ $files == *"package.json"* ]]; then
    impacts+=("⚠️  Run 'npm install' to update dependencies")
  fi
  if [[ $files == *"tsconfig"* ]] || [[ $files == *"babel"* ]] || [[ $files == *"metro"* ]]; then
    impacts+=("⚠️  May require Metro bundler restart")
  fi
  
  printf '%s\n' "${impacts[@]}"
}

# Execute the auto-commit with logging
auto_commit_with_logging
```

### Development Workflow Commands

#### Project Setup
```bash
# Initialize React Native development environment
npm install
npx react-native start --reset-cache
```

#### Build Commands
```bash
# Android Development
npm run android
npx react-native run-android --variant=debug

# iOS Development  
npm run ios
npx react-native run-ios --simulator="iPhone 15"
```

#### Testing and Quality
```bash
# Run linting
npm run lint
npx eslint src/ --ext .ts,.tsx --fix

# Run tests
npm test
npm run test:watch
```

#### Git Workflow
```bash
# Standard development flow
git status
git add .
git commit -m "feat: implement voice recognition feature"
git push origin main
```

### Warp Workflows

#### Mobile Development Workflow
```yaml
# .warp/workflows/mobile-dev.yaml
name: React Native Development
commands:
  - name: "Start Development"
    command: |
      echo "🚀 Starting Stratosphere Mobile development..."
      npm start
  
  - name: "Build Android"
    command: |
      echo "📱 Building for Android..."
      npm run android
      
  - name: "Build iOS"
    command: |
      echo "📱 Building for iOS..."
      npm run ios
      
  - name: "Clean Build"
    command: |
      echo "🧹 Cleaning build artifacts..."
      npm run clean
      cd android && ./gradlew clean && cd ..
```

#### Git Workflow
```yaml
# .warp/workflows/git-flow.yaml  
name: Git Development Flow
commands:
  - name: "Quick Commit"
    command: |
      echo "💾 Quick commit with timestamp..."
      git add .
      git commit -m "WIP: $(date '+%Y-%m-%d %H:%M:%S')"
      
  - name: "Feature Commit"
    command: |
      echo "✨ Feature commit..."
      git add .
      read -p "Enter feature description: " desc
      git commit -m "feat: $desc"
      
  - name: "Sync with Remote"
    command: |
      echo "🔄 Syncing with remote..."
      git pull origin main
      git push origin main
```

## AI Assistant Integration Rules

### Rule 1: Always Commit After AI Changes
```bash
# Execute after every AI prompt that modifies files
post_ai_prompt_hook() {
  if [[ -n $(git status --porcelain) ]]; then
    echo "🤖 AI made changes - committing to git..."
    git add .
    
    # Generate commit message based on changed files
    changed_files=$(git diff --name-only --cached)
    if [[ $changed_files == *".tsx"* ]] || [[ $changed_files == *".ts"* ]]; then
      commit_type="feat"
    elif [[ $changed_files == *"package.json"* ]]; then
      commit_type="deps"
    elif [[ $changed_files == *".md"* ]]; then
      commit_type="docs"
    else
      commit_type="chore"
    fi
    
    git commit -m "$commit_type: AI-assisted changes to $(echo $changed_files | tr '\n' ' ')"
    echo "✅ Committed: $commit_type: AI-assisted changes"
  fi
}
```

### Rule 2: Validate React Native Project Health
```bash
# Check project health before major changes
validate_rn_project() {
  echo "🔍 Validating React Native project..."
  
  # Check if node_modules exists
  if [[ ! -d "node_modules" ]]; then
    echo "⚠️  node_modules not found - running npm install"
    npm install
  fi
  
  # Check TypeScript compilation
  if ! npx tsc --noEmit; then
    echo "❌ TypeScript errors found"
    return 1
  fi
  
  # Check for common React Native issues
  if [[ -f "metro.config.js" ]]; then
    echo "✅ Metro config found"
  else
    echo "⚠️  Metro config missing"
  fi
  
  echo "✅ Project validation complete"
}
```

### Rule 3: Smart Development Server Management
```bash
# Automatically manage development servers
manage_dev_servers() {
  local action=$1
  
  case $action in
    "start")
      echo "🚀 Starting development servers..."
      # Kill existing Metro processes
      pkill -f "metro" 2>/dev/null || true
      # Start Metro bundler
      npm start &
      echo "✅ Metro bundler started"
      ;;
    "stop")
      echo "🛑 Stopping development servers..."
      pkill -f "metro" 2>/dev/null
      echo "✅ Development servers stopped"
      ;;
    "restart")
      manage_dev_servers stop
      sleep 2
      manage_dev_servers start
      ;;
  esac
}
```

## Environment-Specific Commands

### macOS Development Setup
```bash
# macOS-specific React Native setup
setup_macos_rn() {
  echo "🍎 Setting up React Native for macOS..."
  
  # Check Xcode installation
  if ! xcode-select -p &> /dev/null; then
    echo "❌ Xcode not installed - please install from App Store"
    return 1
  fi
  
  # Check CocoaPods
  if ! command -v pod &> /dev/null; then
    echo "📦 Installing CocoaPods..."
    sudo gem install cocoapods
  fi
  
  # Install iOS dependencies
  if [[ -d "ios" ]]; then
    echo "📱 Installing iOS dependencies..."
    cd ios && pod install && cd ..
  fi
  
  echo "✅ macOS React Native setup complete"
}
```

### Android Development
```bash
# Android-specific development commands
android_dev() {
  local action=$1
  
  case $action in
    "devices")
      echo "📱 Available Android devices:"
      adb devices
      ;;
    "logcat")
      echo "📝 Android logs:"
      adb logcat "*:S" "ReactNative:V" "ReactNativeJS:V"
      ;;
    "reverse")
      echo "🔄 Setting up port forwarding..."
      adb reverse tcp:8081 tcp:8081
      adb reverse tcp:3001 tcp:3001
      ;;
    "clean")
      echo "🧹 Cleaning Android build..."
      cd android && ./gradlew clean && cd ..
      ;;
  esac
}
```

## Voice Development Specific Commands

### Voice Service Testing
```bash
# Test voice recognition functionality
test_voice_features() {
  echo "🎤 Testing voice features..."
  
  # Check microphone permissions (requires manual verification)
  echo "1. Testing microphone access..."
  echo "   → Please verify microphone permissions in device settings"
  
  # Test WebSocket connection to computer app
  echo "2. Testing WebSocket connection..."
  if command -v nc &> /dev/null; then
    if nc -z localhost 3001; then
      echo "   ✅ Computer app is reachable on port 3001"
    else
      echo "   ❌ Computer app not accessible - is it running?"
    fi
  fi
  
  echo "3. Voice service validation complete"
}
```

## Project-Specific Aliases

```bash
# Stratosphere Mobile development aliases
alias smdev="npm run android"           # Start Android development
alias smios="npm run ios"               # Start iOS development  
alias smclean="npm run clean"           # Clean build artifacts
alias smtest="npm test"                 # Run tests
alias smlint="npm run lint"             # Run linter
alias smcommit="git add . && git commit -m"  # Quick commit
alias smvoice="test_voice_features"     # Test voice features
alias smsetup="setup_macos_rn"          # Setup development environment
```

## Usage Instructions

### For Warp Terminal Users:

1. **Enable AI Rules**: Copy the rules above into your Warp AI configuration
2. **Import Workflows**: Save the workflow YAML files in `.warp/workflows/`
3. **Set Aliases**: Add the aliases to your shell configuration (`.zshrc` or `.bashrc`)
4. **Auto-Commit**: The post-prompt hook will automatically commit changes after AI assistance

### Command Examples:
```bash
# Start development with auto-setup
smsetup && smdev

# Test voice features  
smvoice

# Quick commit after manual changes
smcommit "fix: resolve voice recognition issue"

# Full development cycle
validate_rn_project && manage_dev_servers start && smdev
```

## Change Logging System

The enhanced auto-commit system now includes comprehensive change logging that automatically updates `changes.md` with detailed information about every modification.

### What Gets Logged:

1. **File Analysis**
   - Files added, modified, or deleted
   - File type and purpose description
   - Line-by-line change analysis

2. **Change Statistics**
   - Number of files changed
   - Lines added and deleted
   - Net change calculation

3. **Impact Assessment**
   - Functionality impact analysis
   - Developer workflow implications
   - Required follow-up actions

4. **Smart Categorization**
   - Automatic commit type detection (feat, docs, deps, config, etc.)
   - Context-aware change descriptions
   - File-specific change analysis

### Benefits:

- **📝 Complete Change History**: Every modification is documented with context
- **🔍 Detailed Analysis**: Understanding what changed and why
- **📊 Statistics Tracking**: Quantitative metrics for all changes
- **🎯 Impact Assessment**: Clear understanding of change implications
- **🤖 AI-Assisted Documentation**: Intelligent change descriptions
- **⚡ Zero Overhead**: Automatic logging with no manual intervention

### Usage Example:

When AI makes changes to your React Native project:

```bash
🤖 AI made changes - analyzing and committing...
✅ Changes committed: feat: AI-assisted changes - 2025-01-13 18:49:14
📝 Updated changes.md with detailed change log
📊 Statistics: 3 files, +127/-5 lines
```

The `changes.md` file will automatically include:
- Timestamp and commit reference
- Detailed file-by-file analysis
- Change statistics and metrics
- Impact assessment
- Follow-up recommendations

---

**Note**: These rules are designed to work with the Stratosphere Mobile React Native project and integrate seamlessly with the Voice Dev Assistant computer application.
