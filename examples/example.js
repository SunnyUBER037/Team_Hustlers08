const { getActions, searchActions, listActions, generateCustomActions } = require('../lib/actionGenerator');

// Example 1: Get actions for food tampering scenario
console.log('=== Example 1: Food Tampering Resolution ===');
const foodTamperingActions = getActions('food tampering incident');
console.log(JSON.stringify({ actions: foodTamperingActions }, null, 2));

console.log('\n=== Example 2: Account Security Issue ===');
const securityActions = getActions('account security issue');
console.log(JSON.stringify({ actions: securityActions }, null, 2));

console.log('\n=== Example 3: Fare Adjustment ===');
const fareActions = getActions('fare adjustment needed');
console.log(JSON.stringify({ actions: fareActions }, null, 2));

console.log('\n=== Example 4: Search for specific actions ===');
const refundActions = searchActions('refund');
console.log('Found refund-related actions:');
refundActions.slice(0, 3).forEach(action => {
  console.log(`- ${action.type}: ${action.requiredArguments.length} required args, ${action.optionalArguments.length} optional args`);
});

console.log('\n=== Example 5: Generate custom action sequence ===');
const customActions = generateCustomActions([
  {
    type: 'updateContactTypeV1',
    constants: { ContactTypeID: 'custom-contact-type-id' },
    description: 'Route to specialized team'
  },
  {
    type: 'addMessageV1',
    arguments: { Message: 'custom-message-id' },
    constants: { Locale: 'en' },
    description: 'Send custom response message'
  },
  'updateContactStatusV1'
]);
console.log(JSON.stringify({ actions: customActions }, null, 2));

console.log('\n=== Example 6: List first 5 available actions ===');
const allActions = listActions();
console.log('Available actions (first 5):');
allActions.slice(0, 5).forEach(action => {
  console.log(`- ${action.type}: ${action.description}`);
}); 