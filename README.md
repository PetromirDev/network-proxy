# Network Testing Proxy

A terminal-based proxy tool for testing your application under various network conditions.

## Setup

Install dependencies:
```bash
npm install
```

Generate and install certificate:
```bash
npx anyproxy-ca
```

## Usage

Start the proxy server:
```bash
npm start
```

Start Chrome with proxy:
```bash
npm run start-chrome
```

## Configuration

Edit `config.js` to customize timeout ranges, failure rates, and endpoint patterns.
