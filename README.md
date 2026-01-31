# Playground

AI agent generated code playground with automated CI/CD pipeline and Cloudflare Pages deployment.

## Features

- ✅ **Automated CI/CD Pipeline** - GitHub Actions for code quality checks
- ✅ **Testing** - Vitest for unit testing with coverage
- ✅ **Code Quality** - ESLint and Prettier for linting and formatting
- ✅ **Security** - Automated security audits
- ✅ **Cloudflare Pages** - Automatic deployment on merge to main

## Setup

### Prerequisites

- Node.js 18+ (recommended: Node.js 20)
- npm

### Installation

```bash
npm install
```

## Development

### Local Development Server

```bash
# Start Vite dev server (with hot reload)
npm run dev

# Preview production build locally
npm run preview
```

### Run Tests

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Check code formatting
npm run format:check

# Format code
npm run format

# Type check (if using TypeScript)
npm run type-check
```

### Build

```bash
npm run build
```

This will create a `dist/` folder with your bundled static website files. Vite will:
- Bundle and minify JavaScript
- Process CSS
- Optimize assets
- Generate production-ready HTML

## CI/CD Pipeline

The repository includes two GitHub Actions workflows:

### 1. PR Checks (`.github/workflows/pr-checks.yml`)

Runs on every Pull Request to `main`:
- Linting (ESLint)
- Format checking (Prettier)
- Type checking (TypeScript)
- Unit tests with coverage
- Security audit
- Build verification

### 2. CI/CD Pipeline (`.github/workflows/ci.yml`)

Runs on:
- **Pull Requests**: Same checks as PR Checks workflow
- **Push to main**: All checks + automatic deployment to Cloudflare Pages

## Cloudflare Pages Deployment

### Setup

1. Create a Cloudflare Pages project in your Cloudflare dashboard
2. Add the following secrets to your GitHub repository:
   - `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token with Pages edit permissions
   - `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

### Configuration

- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/` (repository root)

The deployment happens automatically when code is merged to the `main` branch.

### Manual Deployment

You can also deploy manually using Wrangler CLI:

```bash
npm install -g wrangler
wrangler pages deploy dist --project-name=playground
```

## Project Structure

```
.
├── .github/
│   └── workflows/          # GitHub Actions CI/CD workflows
├── src/                    # Source files
│   ├── main.js            # Main JavaScript entry point
│   └── style.css          # Styles
├── tests/                  # Test files
├── dist/                   # Build output (gitignored)
├── index.html              # HTML entry point
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── vitest.config.ts        # Vitest configuration
├── tsconfig.json           # TypeScript configuration
├── .eslintrc.json          # ESLint configuration
├── .prettierrc.json        # Prettier configuration
└── wrangler.toml           # Cloudflare Pages configuration
```

## Project Setup

This project uses **Vite** for building static websites. The build process:

1. **Development**: Run `npm run dev` to start the Vite dev server with hot module replacement
2. **Production**: Run `npm run build` to create optimized production build in `dist/` folder
3. **Preview**: Run `npm run preview` to preview the production build locally

### Adding More Files

- Add JavaScript files in `src/` and import them in `main.js`
- Add CSS files and import them in your JavaScript or link in `index.html`
- Vite will automatically bundle everything for production

## Security

Security audits run automatically in CI/CD. To run locally:

```bash
npm run security:audit
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Ensure all tests pass: `npm test`
4. Ensure code is formatted: `npm run format`
5. Ensure linting passes: `npm run lint`
6. Create a Pull Request

The CI/CD pipeline will automatically validate your changes before merging.
