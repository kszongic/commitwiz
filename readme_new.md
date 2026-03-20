# commitwiz 🤖

[![npm version](https://img.shields.io/npm/v/commitwiz)](https://www.npmjs.com/package/commitwiz)
[![npm downloads](https://img.shields.io/npm/dm/commitwiz)](https://www.npmjs.com/package/commitwiz)
[![Node.js](https://img.shields.io/node/v/commitwiz)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

AI-powered git commit message generator. Stage your changes, run `commitwiz`, get perfect [Conventional Commits](https://www.conventionalcommits.org/) — every time.

```
$ git add -A && commitwiz

🤖 Analyzing diff... (3 files changed, +47 -12)

  feat(auth): add JWT refresh token rotation

  Implement automatic refresh token rotation on each access token
  renewal. Expired refresh tokens are now invalidated server-side
  to prevent replay attacks.

? [C]ommit  [E]dit  [R]egenerate  [Q]uit: C
✅ Committed!
```

## Why?

- **Consistent history** — No more `fix stuff`, `wip`, or `asdf`. Every commit follows Conventional Commits format.
- **Context-aware** — Reads your actual diff, not just file names. Understands what changed and why.
- **Fast** — Uses `gpt-4o-mini` by default. Most commits generate in under 2 seconds.
- **Works with local models** — Ollama, LM Studio, or any OpenAI-compatible API. Your code never has to leave your machine.
- **Interactive** — Review before committing. Edit, regenerate, or bail out.

## Install

```bash
npm install -g commitwiz
```

Or run without installing:

```bash
npx commitwiz
```

## Quick Start

```bash
# 1. Set your API key (or use a local model — see below)
export OPENAI_API_KEY=sk-...

# 2. Stage changes
git add -A

# 3. Generate and commit
commitwiz
```

## Usage

```bash
# Interactive mode (default) — review, edit, regenerate, or quit
commitwiz

# Auto-commit without confirmation
commitwiz --auto

# Use a specific model
commitwiz --model gpt-4o

# Use a local model via Ollama
OPENAI_BASE_URL=http://localhost:11434/v1 commitwiz --model llama3
```

## Features

| Feature | Details |
|---------|---------|
| 🤖 **AI-powered** | Uses OpenAI (or any compatible API) to analyze your staged diff |
| 📝 **Conventional Commits** | Always generates properly formatted `type(scope): description` messages |
| ⚡ **Fast** | `gpt-4o-mini` by default — sub-2-second generation |
| 🔄 **Interactive** | Commit, edit, regenerate, or quit — you're always in control |
| 🏠 **Local models** | Works with Ollama, LM Studio, or any OpenAI-compatible endpoint |
| 🔒 **Private** | Use local models and your code never leaves your machine |

## Configuration

### OpenAI (default)

```bash
export OPENAI_API_KEY=sk-...
```

### Ollama (local, free)

```bash
# Install Ollama and pull a model
ollama pull llama3

# Point commitwiz at Ollama
export OPENAI_BASE_URL=http://localhost:11434/v1
commitwiz --model llama3
```

### LM Studio (local, free)

```bash
# Start LM Studio's local server, then:
export OPENAI_BASE_URL=http://localhost:1234/v1
export OPENAI_API_KEY=lm-studio
commitwiz
```

### Any OpenAI-compatible API

```bash
export OPENAI_BASE_URL=https://your-api.example.com/v1
export OPENAI_API_KEY=your-key
commitwiz --model your-model
```

## Recipes

### Git hook (auto-generate on every commit)

```bash
# .git/hooks/prepare-commit-msg
#!/bin/sh
if [ -z "$2" ]; then
  MSG=$(commitwiz --auto --stdout 2>/dev/null)
  [ -n "$MSG" ] && echo "$MSG" > "$1"
fi
```

### Team workflow with commitlint

```bash
# Install commitlint for validation
npm install -D @commitlint/cli @commitlint/config-conventional

# commitwiz generates → commitlint validates
commitwiz --auto && npx commitlint --edit
```

### CI: Validate commit messages in pull requests

```yaml
# .github/workflows/commitlint.yml
name: Lint Commits
on: [pull_request]
jobs:
  commitlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - run: npx commitlint --from ${{ github.event.pull_request.base.sha }}
```

### Quick alias

```bash
# Add to ~/.bashrc or ~/.zshrc
alias gc='git add -A && commitwiz'
```

### Batch commits (monorepo)

```bash
# Commit each package separately
for dir in packages/*/; do
  cd "$dir"
  git add -A
  commitwiz --auto
  cd ../..
done
```

## How It Works

1. **Reads your staged diff** via `git diff --cached`
2. **Sends the diff** to your configured LLM with a system prompt enforcing Conventional Commits format
3. **Presents the message** for review (or auto-commits with `--auto`)
4. **Commits** using `git commit -m "..."` on confirmation

The prompt ensures:
- Correct `type(scope): description` format
- Imperative mood ("add" not "added")
- Concise subject line (≤72 chars)
- Optional body for complex changes

## Comparison

| Tool | AI-Powered | Local Models | Interactive | Conventional Commits | Zero Config |
|------|:---:|:---:|:---:|:---:|:---:|
| **commitwiz** | ✅ | ✅ | ✅ | ✅ | ✅ |
| [aicommits](https://github.com/Nutlope/aicommits) | ✅ | ❌ | ❌ | ❌ | ✅ |
| [cz-cli](https://github.com/commitizen/cz-cli) | ❌ | N/A | ✅ | ✅ | ❌ |
| [commitlint](https://github.com/conventional-changelog/commitlint) | ❌ | N/A | ❌ | ✅ (validation only) | ❌ |
| Manual | ❌ | N/A | N/A | Sometimes | ✅ |

## Use Cases

- **Solo developers** — Stop agonizing over commit wording. Let AI draft, you approve.
- **Teams** — Enforce consistent Conventional Commits without training everyone on the spec.
- **Open source** — Clean commit history makes changelogs and releases trivial.
- **Monorepos** — Scope-aware messages help track which package changed.
- **CI/CD** — Conventional Commits enable automatic versioning with [semantic-release](https://github.com/semantic-release/semantic-release).

## Related Tools

- [`env-lint-cli`](https://www.npmjs.com/package/env-lint-cli) — Validate .env files before deploying
- [`dep-size`](https://www.npmjs.com/package/dep-size) — Check npm dependency sizes before installing
- [`license-maker`](https://www.npmjs.com/package/license-maker) — Generate LICENSE files from the CLI
- [`npm-name-check`](https://www.npmjs.com/package/npm-name-check) — Check npm package name availability
- [`kill-port-cli`](https://www.npmjs.com/package/kill-port-cli) — Kill processes on any port

## License

MIT
