# Testing Real GitHub Copilot Provider

## 🎯 Overview

This document explains how to test the Real GitHub Copilot Provider integration in the ThinkCode AI Platform.

## 🔑 Prerequisites

### 1. GitHub Token Setup

You need a GitHub Personal Access Token with appropriate permissions:

**Option A: GitHub Copilot API Token (Recommended)**

```bash
# Set your GitHub Copilot API token
set GITHUB_TOKEN=gho_your_github_copilot_token_here
```

**Option B: GitHub Personal Access Token**

1. Go to https://github.com/settings/personal-access-tokens/tokens
2. Generate new token (classic)
3. Select required scopes:
   - `repo` (Full control of private repositories)
   - `user` (Update user profile)
   - `read:user` (Read user profile data)

```bash
# Set your GitHub personal access token
set GITHUB_TOKEN=ghp_your_github_personal_token_here
```

**Option C: GitHub CLI Token**

```bash
# If you have GitHub CLI installed and authenticated
gh auth status
# Copy the token from output and set it
set GH_TOKEN=your_gh_cli_token_here
```

### 2. GitHub Copilot Subscription

Make sure you have an active GitHub Copilot subscription:

- Individual Plan: $10/month
- Business Plan: $19/user/month
- Enterprise Plan: Contact GitHub

Check your subscription at: https://github.com/settings/copilot

## 🧪 Running Tests

### Quick Test (Recommended)

Run the automated test script:

```batch
# From project root directory
.\test-real-copilot.bat
```

This script will:

1. ✅ Check if GitHub token is set
2. 📦 Install dependencies
3. 🔨 Compile TypeScript
4. 🧪 Run comprehensive tests

### Manual Test

If you prefer to run tests manually:

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set your GitHub token
set GITHUB_TOKEN=your_token_here

# Run the test
npx ts-node src/test-real-copilot.ts
```

## 📋 Test Coverage

The test suite validates:

### 1. Service Initialization ✅

- Validates GitHub token
- Initializes GitHub Copilot provider
- Confirms authentication

### 2. Health Check ✅

- Verifies Copilot access
- Checks subscription status
- Validates chat availability
- Reports user information

### 3. Provider Discovery ✅

- Lists available providers
- Shows provider capabilities
- Confirms real provider registration

### 4. Model Discovery ✅

- Fetches available AI models
- Lists model capabilities
- Shows model compatibility

### 5. Chat Functionality ✅

- Sends real chat request
- Validates response format
- Reports token usage
- Tests error handling

## 📊 Expected Output

### Successful Test Run

````
🚀 Testing Real GitHub Copilot Provider...

🔑 Testing with token: gho_1234...
📋 Test 1: Initializing service...
✅ Service initialized successfully
📋 Test 2: Checking service health...
✅ Health check passed:
   Status: healthy
   Has Access: true
   Plan: copilot_individual
   Chat Enabled: true
   Username: your-username
📋 Test 3: Getting available providers...
✅ Providers fetched:
   - Real GitHub Copilot (real-github-copilot): Enabled
📋 Test 4: Getting available models...
✅ Models fetched:
   - GPT-4 (gpt-4): [code-completion, chat, explanation]
   - GPT-3.5 Turbo (gpt-3.5-turbo): [code-completion, chat]
📋 Test 5: Testing chat functionality...
✅ Chat response received:
   Content: Here's a simple TypeScript function that adds two numbers:

```typescript
function addNumbers(a: number, b: number): number {
    return a + b;
}
````

This function takes two parameters of type `number` and returns their sum.
Usage: 45 + 89 = 134 tokens

🎉 All tests passed! Real GitHub Copilot Provider is working correctly!

```

### Failed Test Examples

**Invalid Token:**
```

❌ GITHUB_TOKEN environment variable is not set
Please set your GitHub token:
set GITHUB_TOKEN=your_github_token_here

```

**No Copilot Access:**
```

❌ Health check failed: User does not have GitHub Copilot access
Please check your GitHub Copilot subscription at: https://github.com/settings/copilot

```

**Network Issues:**
```

❌ Initialization failed: Failed to connect to GitHub API
Please check your internet connection and try again

````

## 🔧 Troubleshooting

### Common Issues

#### 1. "No GitHub token found"
- Ensure you've set the environment variable: `set GITHUB_TOKEN=your_token`
- Restart your terminal after setting the token
- Verify token with: `echo %GITHUB_TOKEN%`

#### 2. "User does not have GitHub Copilot access"
- Check your subscription: https://github.com/settings/copilot
- Ensure your plan includes API access
- Contact GitHub support if needed

#### 3. "Failed to exchange token"
- Verify your token has correct permissions
- Check if token is expired
- Try regenerating the token

#### 4. "Chat request failed"
- Check your internet connection
- Verify Copilot service status
- Try with a simpler prompt

#### 5. TypeScript compilation errors
- Run: `npm install` to ensure dependencies
- Update Node.js to latest LTS version
- Clear node_modules and reinstall if needed

### Debug Mode

For detailed debugging, set debug environment variable:

```bash
set DEBUG=copilot:*
npx ts-node src/test-real-copilot.ts
````

## 🚀 Integration Status

Once tests pass, the Real GitHub Copilot Provider is ready for integration with:

- ✅ **Project Initialization Service**: Automatic provider selection
- ✅ **Task Processing Workflows**: Real AI-powered task execution
- ✅ **Admin Panel**: Provider management and monitoring
- ✅ **Document Generation**: AI-assisted content creation

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review GitHub Copilot documentation: https://docs.github.com/en/copilot
3. Verify your subscription and permissions
4. Contact the development team with test output logs

---

**🎯 Ready to use real GitHub Copilot in ThinkCode AI Platform!**
