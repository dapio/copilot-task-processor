# GitHub Copilot Instructions for [Project Name]

## Project Context
- **Type**: [e.g., Web App, API, MCP Server]
- **Tech Stack**: [Your stack]
- **Architecture**: [e.g., Microservices, Monolith]

## Code Standards
- Use TypeScript strict mode
- Follow functional programming principles where possible
- All functions must have JSDoc comments
- Test coverage minimum: 80%

## Naming Conventions
- Files: kebab-case
- Functions: camelCase
- Classes: PascalCase
- Constants: UPPER_SNAKE_CASE

## Project-Specific Rules
- Always validate input data
- Use Zod for schema validation
- Error handling: always use Result<T, E> pattern
- Async operations: use proper error boundaries

## Testing Requirements
- Unit tests: Jest
- Integration tests: Playwright
- Every feature needs tests before commit

## MCP Server Specific
- Follow MCP protocol specification
- Use official MCP SDK
- Document all tools and prompts