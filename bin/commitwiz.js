#!/usr/bin/env node

const { execSync } = require('child_process');
const https = require('https');
const readline = require('readline');

const VERSION = '1.0.0';

// Colors
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8' }).trim();
  } catch {
    return '';
  }
}

function getStagedDiff() {
  const diff = run('git diff --cached --stat');
  const detailed = run('git diff --cached --no-color');
  if (!diff) {
    console.log(`${c.red}No staged changes found.${c.reset} Stage files with: git add <files>`);
    process.exit(1);
  }
  return { summary: diff, detailed };
}

function truncate(str, maxLen = 8000) {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '\n... (truncated)';
}

async function generateCommitMessage(diff, apiKey, model = 'gpt-4o-mini') {
  const prompt = `You are a git commit message expert. Generate a concise, conventional commit message for these changes.

Rules:
- Use conventional commits format: type(scope): description
- Types: feat, fix, refactor, docs, style, test, chore, perf, ci, build
- Keep the first line under 72 characters
- Add a blank line then bullet points for details if needed
- Be specific about what changed, not how

Diff summary:
${diff.summary}

Detailed diff (may be truncated):
${truncate(diff.detailed)}

Respond with ONLY the commit message, no explanation.`;

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 300,
    });

    const url = new URL(process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/chat/completions');
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.error) {
            reject(new Error(json.error.message || 'API error'));
            return;
          }
          resolve(json.choices[0].message.content.trim());
        } catch (e) {
          reject(new Error(`Failed to parse response: ${body.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function askUser(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
${c.bold}commitwiz${c.reset} v${VERSION} — AI-powered git commit messages

${c.bold}Usage:${c.reset}
  ${c.cyan}commitwiz${c.reset}              Generate commit message for staged changes
  ${c.cyan}commitwiz --auto${c.reset}       Auto-commit without confirmation
  ${c.cyan}commitwiz --model${c.reset} NAME Use a specific model (default: gpt-4o-mini)

${c.bold}Environment:${c.reset}
  OPENAI_API_KEY       Your OpenAI API key (required)
  OPENAI_BASE_URL      Custom API endpoint (optional, for proxies/local models)

${c.bold}Examples:${c.reset}
  git add -A && commitwiz
  OPENAI_API_KEY=sk-... commitwiz --auto
  commitwiz --model gpt-4o
`);
    process.exit(0);
  }

  if (args.includes('--version') || args.includes('-v')) {
    console.log(VERSION);
    process.exit(0);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log(`${c.red}Missing OPENAI_API_KEY${c.reset}`);
    console.log(`Set it: ${c.cyan}export OPENAI_API_KEY=sk-...${c.reset}`);
    process.exit(1);
  }

  const autoCommit = args.includes('--auto') || args.includes('-y');
  const modelIdx = args.indexOf('--model');
  const model = modelIdx !== -1 ? args[modelIdx + 1] : 'gpt-4o-mini';

  console.log(`${c.dim}Analyzing staged changes...${c.reset}`);
  const diff = getStagedDiff();
  
  console.log(`${c.dim}Generating commit message with ${model}...${c.reset}\n`);
  
  try {
    const message = await generateCommitMessage(diff, apiKey, model);
    
    console.log(`${c.green}${c.bold}Suggested commit message:${c.reset}\n`);
    console.log(`  ${message.split('\n').join('\n  ')}\n`);

    if (autoCommit) {
      execSync(`git commit -m ${JSON.stringify(message)}`, { stdio: 'inherit' });
      console.log(`\n${c.green}✓ Committed!${c.reset}`);
      return;
    }

    const answer = await askUser(`${c.yellow}[c]ommit / [e]dit / [r]egenerate / [q]uit: ${c.reset}`);
    
    switch (answer.toLowerCase()) {
      case 'c':
      case 'commit':
      case 'y':
      case 'yes':
        execSync(`git commit -m ${JSON.stringify(message)}`, { stdio: 'inherit' });
        console.log(`\n${c.green}✓ Committed!${c.reset}`);
        break;
      case 'e':
      case 'edit':
        const edited = await askUser(`${c.cyan}Enter your message: ${c.reset}`);
        if (edited) {
          execSync(`git commit -m ${JSON.stringify(edited)}`, { stdio: 'inherit' });
          console.log(`\n${c.green}✓ Committed!${c.reset}`);
        }
        break;
      case 'r':
      case 'regenerate':
        console.log(`${c.dim}Regenerating...${c.reset}\n`);
        const newMessage = await generateCommitMessage(diff, apiKey, model);
        console.log(`${c.green}${c.bold}New suggestion:${c.reset}\n`);
        console.log(`  ${newMessage.split('\n').join('\n  ')}\n`);
        const answer2 = await askUser(`${c.yellow}Commit this? [y/n]: ${c.reset}`);
        if (answer2.toLowerCase() === 'y') {
          execSync(`git commit -m ${JSON.stringify(newMessage)}`, { stdio: 'inherit' });
          console.log(`\n${c.green}✓ Committed!${c.reset}`);
        }
        break;
      default:
        console.log(`${c.dim}Aborted.${c.reset}`);
    }
  } catch (err) {
    console.error(`${c.red}Error: ${err.message}${c.reset}`);
    process.exit(1);
  }
}

main();
