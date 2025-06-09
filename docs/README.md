# Action Generator

A JavaScript library that uses `atlas.json` as the source of truth to generate action arrays in a specific format for customer service workflows.

## Features

- **Source of Truth**: Uses `atlas.json` to ensure all actions are valid and up-to-date
- **Intelligent Matching**: Matches user requests to appropriate action sequences
- **Predefined Scenarios**: Common customer service scenarios with proper action sequences
- **Flexible API**: Support for custom action generation and search functionality
- **Proper Formatting**: Returns actions in the exact format required by your system

## Installation

1. Ensure you have `atlas.json` in the same directory
2. Include the `actionGenerator.js` file in your project

```javascript
const { getActions, searchActions, listActions } = require('./actionGenerator');
```

## Usage Examples

### 1. Get Actions for Common Scenarios

```javascript
// Food tampering incident
const actions = getActions('food tampering incident');

// Account security issue
const actions = getActions('account security issue');

// Fare adjustment
const actions = getActions('fare adjustment needed');
```

### 2. Search for Specific Actions

```javascript
// Search for refund-related actions
const refundActions = searchActions('refund');

// Search for user-related actions
const userActions = searchActions('user');
```

### 3. Generate Custom Action Sequences

```javascript
const customActions = generateCustomActions([
  {
    type: 'updateContactTypeV1',
    constants: { ContactTypeID: 'specialist-team' },
    description: 'Route to specialized team'
  },
  {
    type: 'addMessageV1',
    arguments: { Message: 'custom-message' },
    constants: { Locale: 'en' },
    description: 'Send custom response'
  },
  'updateContactStatusV1' // Simple string format
]);
```

### 4. List All Available Actions

```javascript
const allActions = listActions();
console.log(allActions); // Returns array with type, description, and argument counts
```

## API Reference

### Main Functions

- `getActions(request)` - Returns action array based on user request
- `searchActions(query)` - Search for actions by name or description
- `listActions()` - Get all available actions with metadata
- `generateCustomActions(actionTypes)` - Generate custom action sequences
- `findAction(actionType)` - Find specific action by type name

### Action Object Format

Each action returned follows this format:

```javascript
{
  "actionType": "updateContactTypeV1",
  "arguments": {
    "ContactTypeID": "ed83fbbf-01bc-4bfc-a200-2ee8d4ae7368"
  },
  "constants": {},
  "description": "Update the contact type for customer service routing",
  "descriptionTemplateCalculators": {},
  "idempotenceType": null,
  "name": "",
  "shouldSkip": null,
  "descriptionRosettaKey": null
}
```

## Predefined Scenarios

### Food Tampering Resolution
- Routes to food safety specialist
- Applies full refund
- Sends acknowledgment message
- Marks contact as resolved

### Account Security Issue
- Locks account with notifications
- Adds security incident note
- Escalates to security team

### Fare Adjustment
- Adjusts fare with reason
- Adds explanatory note
- Notifies user of changes

## Command Line Usage

```bash
# Get actions for a scenario
node actionGenerator.js "food tampering"

# List all available actions
node actionGenerator.js "list all"

# Search for specific actions
node actionGenerator.js "refund"
```

## Running Examples

```bash
node example.js
```

This will demonstrate all the main features and show sample outputs.

## Extending the System

### Adding New Scenarios

To add new predefined scenarios, modify the `getScenarioActions` method in `actionGenerator.js`:

```javascript
'new_scenario': [
  {
    type: 'actionTypeV1',
    constants: { key: 'value' },
    description: 'Action description'
  }
]
```

### Adding New Action Descriptions

Update the `generateDescription` method to include descriptions for new action types:

```javascript
const descriptions = {
  'newActionTypeV1': 'Description for new action type',
  // ... existing descriptions
};
```

## Error Handling

The system includes error handling for:
- Missing `atlas.json` file
- Invalid action types
- Malformed requests

Errors are logged to console and the system gracefully handles missing data.

## Dependencies

- Node.js (for file system operations)
- `atlas.json` (source of truth for available actions)

## Notes

- UUIDs are auto-generated for required arguments if not provided
- Optional arguments are only included if explicitly provided
- All actions are validated against the atlas.json schema
- The system is designed to be extended with new scenarios and action types 