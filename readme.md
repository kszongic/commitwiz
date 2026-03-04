# commitwiz 🧙

AI-powered git commit message generator. Stage your changes, run `commitwiz`, get perfect conventional commit messages.

## Install

```bash
npm install -g commitwiz
```

## Usage

```bash
# Stage your changes
git add -A

# Generate a commit message
commitwiz

# Auto-commit without confirmation
commitwiz --auto

# Use a specific model
commitwiz --model gpt-4o
```

## Features

- 🤖 **AI-powered** — Uses OpenAI (or any compatible API) to analyze your diff
- 📝 **Conventional Commits** — Always generates properly formatted messages
- ⚡ **Fast** — Uses gpt-4o-mini by default for speed
- 🔄 **Interactive** — Commit, edit, regenerate, or quit
- 🔌 **Flexible** — Works with any OpenAI-compatible API (Ollama, LM Studio, etc.)

## Configuration

Set your OpenAI API key:

```bash
export OPENAI_API_KEY=sk-...
```

For local models or custom endpoints:

```bash
export OPENAI_BASE_URL=http://localhost:11434/v1/chat/completions
```

## License

MIT
