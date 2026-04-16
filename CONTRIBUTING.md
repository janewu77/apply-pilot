# Contributing to Apply Pilot

Thank you for your interest in Apply Pilot! Bug reports, feature suggestions, and code contributions are all welcome. — [中文版](CONTRIBUTING.zh.md)

## Submitting an Issue

### Reporting a Bug

Please include as much of the following as possible to help us reproduce and diagnose:

- **Chrome version** (find it at `chrome://settings/help`)
- **Extension version** (find it at `chrome://extensions/`)
- **Job site where the issue occurred** (e.g. LinkedIn, Greenhouse, a company's career page)
- **Steps to reproduce**: describe exactly what you did
- **Actual result** vs **expected result**
- **DevTools Console screenshot** (if there are errors)

### Feature Requests

Just describe the scenario and what you'd like to achieve — no need to write a technical spec.

---

## Submitting a Pull Request

### Process

1. Fork this repository
2. Create your feature branch from `main`: `git checkout -b feat/your-feature`
3. Make and test your changes locally (see [DEVELOPMENT.md](DEVELOPMENT.md))
4. Commit your changes: `git commit -m "feat: short description"`
5. Push to your fork: `git push origin feat/your-feature`
6. Open a Pull Request on GitHub describing what you changed and how to test it

### PR Requirements

- One PR = one thing — keep the scope of changes clear
- In the PR description, explain: **what changed, why, and how to test it**
- If your PR fixes an issue, add `Closes #<issue-number>` to the description

---

## Code Style

This project does not use ESLint or Prettier. Please follow these conventions:

- **2-space indentation**
- **Single quotes** for strings
- **camelCase** for functions and variables; **UPPER_SNAKE_CASE** for constants
- Keep the file-purpose comment at the top of each module (see existing files for the format)
- Avoid adding external dependencies — this is a plain native JS extension with no bundler

## Commit Message Format

Use a simple prefix to indicate the type of change:

| Prefix | Meaning |
|--------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `style:` | Style/CSS adjustments |
| `refactor:` | Refactoring (no functional change) |
| `chore:` | Build, config, or miscellaneous |

Example: `fix: correctly match email field on LinkedIn application form`

---

Thanks again for contributing 🙌
