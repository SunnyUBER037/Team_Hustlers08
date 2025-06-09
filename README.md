# Action Generator

> Interactive system for generating customer service actions using atlas.json as source of truth

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js->=14.0.0-green.svg)](https://nodejs.org/)

## 🚀 Quick Start

```bash
# Install Node.js (if not installed)
# Download from: https://nodejs.org

# Run the interactive system
npm start
```

## 📋 What It Does

1. **Ask for any action** (e.g., "food tampering", "refund customer")
2. **Get generated actions** from atlas.json
3. **Specify policy** (eater/rider/merchant)
4. **Receive complete resolution** with action array

## 🎯 Example Usage

```
👤 Your query: refund customer
✅ Generated 4 actions:
   1. Route to refund specialist
   2. Process customer refund
   3. Send refund confirmation message
   4. Mark refund as processed

🎯 Is this for eater, rider, or merchant? (e/r/m): e
💡 Resolution: Eater refunds are processed immediately with full compensation...
```

## 📁 Project Structure

```
action-generator/
├── src/
│   └── index.js              # Main interactive system
├── lib/
│   ├── actionGenerator.js    # Node.js library
│   └── actionGenerator-browser.js # Browser library
├── examples/
│   ├── example.js           # Usage examples
│   └── demo.html           # Web demo
├── docs/
│   ├── README.md           # Detailed documentation
│   └── HOW_TO_USE.md       # Usage guide
├── atlas.json              # Action definitions (SOT)
└── package.json           # Project configuration
```

## 🛠️ Available Scripts

```bash
npm start     # Run interactive system
npm run demo  # Run examples
npm run dev   # Development mode
```

## 📖 Documentation

- **[How to Use](docs/HOW_TO_USE.md)** - Step-by-step usage guide
- **[Full Documentation](docs/README.md)** - Complete API reference
- **[Examples](examples/)** - Code examples and demos

## 🎪 Supported Queries

| Query Type | Example | Actions Generated |
|------------|---------|-------------------|
| Food Issues | `"food tampering"` | Route → Refund → Message → Resolve |
| Refunds | `"refund customer"` | Route → Process → Confirm → Close |
| Security | `"account security"` | Lock → Note → Escalate |
| Trip Issues | `"trip problem"` | Adjust → Note → Notify |

## 🏗️ Requirements

- **Node.js** >= 14.0.0
- **atlas.json** file (included)

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**Team08_Hustlers** | Built with ❤️ for customer service excellence 