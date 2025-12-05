# Contributing

Thanks for your interest in contributing! 🎉

This is a small, open-source project, and contributions of all kinds are welcome — whether it's bug report (fixes preferred), new features, documentation improvements, or just feedback.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v22 or higher recommended)
- [pnpm](https://pnpm.io/) (v10+)

### Setup

1. Fork and clone the repository
2. Install dependencies:
    ```bash
    pnpm install
    ```
3. Run the dev server for the docs site:
    ```bash
    pnpm dev
    ```
4. Run tests:
    ```bash
    pnpm test
    ```

### Project Structure

```
heatmap/
├── packages/
│   └── heatmap/          # npm package (TypeScript library)
│       ├── src/          # Source files
├── docs/                 # Documentation website
│   ├── src/              # Source files
├── package.json          # Root workspace configuration
├── pnpm-workspace.yaml   # pnpm workspace definition
```

## Making Changes

1. Create a new branch for your changes
2. Make your changes
3. Test your changes `pnpm test:run`
4. Commit your changes (see commit guidelines below)
5. Open a pull request

## Development

### Run locally

```bash
# Start the docs dev server (with live reload)
pnpm dev

# Build the library in watch mode
pnpm dev:lib
```

### Build

```bash
# Build everything (library + docs)
pnpm build

# Build only the library
pnpm build:lib

# Build only the docs
pnpm build:docs
```

### Testing

```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run

# Run tests with coverage
pnpm test:coverage
```

## Commit Guidelines

This project tries to follow [Conventional Commits](https://www.conventionalcommits.org/). Please format your commit messages like this:

```
type(scope): description

[optional body]
```

At least the PR title should follow this convention when we squash and merge.

**Types:**

- `feat` - A new feature
- `fix` - A bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code changes that neither fix bugs nor add features
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

**Examples:**

```
feat(tooltip): add custom formatter option
fix(renderer): correct gradient calculation for edge cases
docs: update installation instructions
```

## Releasing

Using Nx release

```bash
nx release publish --otp=<OTP>
```

```bash
nx release version 1.420.69
```

```bash
nx release changelog 1.420.69
```
## Questions?

Feel free to open an issue if you have questions or run into problems. Happy coding! 🚀
