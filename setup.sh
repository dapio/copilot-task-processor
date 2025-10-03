# Node.js project
npm init -y

# TypeScript
npm install -D typescript @types/node ts-node tsx
npx tsc --init

# Linting & Formatting
npm install -D eslint prettier eslint-config-prettier
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Testing
npm install -D jest @types/jest ts-jest
npm install -D @playwright/test

# Git hooks
npm install -D husky lint-staged
npx husky init