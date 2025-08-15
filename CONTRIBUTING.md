# Contributing to Loon

Thanks for your interest in contributing to Loon! We welcome contributions from the community.

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm

### Setup
```bash
git clone https://github.com/jackmayhew/loon.git
cd loon
pnpm install
pnpm dev  # Note: Full functionality requires a backend connection
```

*Note: Full development environment with mock backend is coming soon.*

#### Loading the Extension
- **Chrome/Edge:** Go to `chrome://extensions`, enable "Developer mode", click "Load unpacked", and select the `extension` folder.
- **Firefox:** Go to `about:debugging`, click "This Firefox", click "Load Temporary Add-on…", and select the `extension/manifest.json` file.

## How to Contribute

### Reporting Issues
- Check existing issues before creating a new one
- Use the issue templates when available
- Include browser version, extension version, and steps to reproduce
- For feature requests, explain the use case and expected behavior

### Code Contributions
*Development setup is being finalized. Code contribution guidelines will be available soon.*

### Other Ways to Help
- **Report bugs** - Help us identify and fix issues
- **[Submit Canadian products](https://getloon.ca/submit-product)** - Know a great Canadian product we should include?
- **Improve documentation** - Fix typos, clarify instructions
- **Feature requests** - Share ideas for making Loon better

## Code Style
- TypeScript for all new code
- Use existing ESLint/Prettier configurations
- Follow Vue 3 composition API patterns
- Write meaningful commit messages following the [Conventional Commits](https://www.conventionalcommits.org/) specification

## Pull Request Process
*Coming soon - we're setting up CI/CD and review processes*

## Questions?
Feel free to open an issue for questions about contributing or the codebase.

## License
By contributing, you agree that your contributions will be licensed under the MIT License.
