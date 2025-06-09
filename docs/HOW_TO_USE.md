# 🚀 How to Use the Interactive Action System

## Quick Start

1. **Run the system:**
   ```bash
   node interactive_action_system.js
   ```

2. **The system will guide you through 3 simple steps:**

## Step-by-Step Usage

### Step 1: Enter Your Query
When prompted, type what you need help with:
```
👤 Your query (or "exit" to quit): food tampering issue
```

**Example queries:**
- `food tampering`
- `refund customer`
- `account security`
- `trip issue`
- `driver problem`
- `fare adjustment`
- `status update`

### Step 2: Get Generated Actions
The system shows you the actions it will execute:
```
✅ Generated 4 actions:
   1. Route to food safety specialist team
   2. Apply food safety resolution with refund
   3. Send food safety acknowledgment message
   4. Mark food safety issue as resolved
```

### Step 3: Specify Policy
Tell the system who this is for:
```
🎯 Is this for eater, rider, or merchant? (e/r/m): e
```
- Type `e` for **eater** (customer)
- Type `r` for **rider** (passenger)
- Type `m` for **merchant** (restaurant/business)

### Step 4: Get Your Resolution
The system provides:
- **Policy-specific resolution**
- **Complete action array** (ready to execute)

## Example Complete Flow

```
💬 Ask me about any action you need:
👤 Your query: refund customer

🔍 Processing query: "refund customer"

✅ Generated 4 actions:
   1. Route to refund specialist
   2. Process customer refund
   3. Send refund confirmation message
   4. Mark refund as processed

📋 Policy clarification needed:
🎯 Is this for eater, rider, or merchant? (e/r/m): e

📊 FINAL RESULTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Policy: EATER
💡 Resolution: Eater refunds are processed immediately with full compensation plus additional credits for inconvenience.

🔧 Actions to execute:
{
  "actions": [
    {
      "actionType": "updateContactTypeV1",
      "arguments": {},
      "constants": {
        "ContactTypeID": "refund-specialist"
      },
      "description": "Route to refund specialist",
      ...
    }
  ]
}
```

## Supported Query Types

| Query | What it handles |
|-------|----------------|
| `food tampering`, `food safety`, `food quality` | Food-related issues with full refund |
| `refund`, `money back` | Customer refund requests |
| `account security`, `hack`, `locked account` | Security incidents |
| `trip issue`, `fare problem`, `driver issue` | Ride-related problems |
| `support`, `help`, `general issue` | General support requests |
| `status update` | Contact status changes |

## Different Policy Resolutions

### For Eaters (Customers)
- **Food issues:** Immediate refunds + safety measures
- **Refunds:** Full compensation + credits
- **Account:** Priority support + protection
- **Trips:** Fare adjustments + service credits

### For Riders (Passengers)
- **Food delivery:** Compensation + driver review
- **Refunds:** Fare adjustments + future credits
- **Account:** Identity verification + lockdown
- **Trips:** Fare adjustments + accountability

### For Merchants (Restaurants)
- **Food safety:** Investigation + partnership review
- **Refunds:** Rating impact + process improvements
- **Account:** Business verification + protection
- **Delivery:** Driver training + optimization

## Tips

✅ **Use natural language** - "customer wants refund" works just as well as "refund"

✅ **Be specific** - "food tampering" gives better actions than just "food"

✅ **Try variations** - If no actions are found, try related terms

✅ **Continue conversations** - Process multiple queries in one session

## Exit the System

Type `exit` when asked for a query, or `n` when asked to continue.

That's it! The system handles everything else automatically. 🎉 