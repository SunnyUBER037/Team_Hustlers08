// Browser-compatible Action Generator
// This version works with atlas data passed directly instead of reading from file system

class ActionGenerator {
  constructor(atlasData = null) {
    this.atlasData = atlasData;
    if (!atlasData) {
      console.warn('Atlas data not provided. Use setAtlasData() method to load data.');
    }
  }

  setAtlasData(atlasData) {
    this.atlasData = atlasData;
    console.log(`Loaded ${this.atlasData.result.length} actions from atlas data`);
  }

  // Generate a random UUID (for demonstration purposes)
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Generate human-readable description for an action
  generateDescription(actionType, actionData) {
    const descriptions = {
      'updateContactTypeV1': 'Update the contact type for customer service routing',
      'applyResolutionV1': 'Apply resolution with refund and compensation details',
      'updateContactTierV1': 'Escalate contact to higher tier for additional support',
      'createBlacklistEntryV1': 'Create blacklist entry to prevent future interactions',
      'addMessageV1': 'Send automated message response to customer',
      'updateContactStatusV1': 'Update contact status to mark as resolved',
      'accountLockdownV1': 'Lock down user account for security purposes',
      'addUserNoteV1': 'Add internal note to user profile',
      'adjustFareV1': 'Adjust trip fare amount with specified reason',
      'refundEaterV1': 'Process refund for eater/customer',
      'banClientV1': 'Ban client account with specified reason',
      'addTripNoteV1': 'Add note to trip record for reference',
      'sendNotificationV1': 'Send notification to user',
      'updateUserInfoV1': 'Update user profile information',
      'deleteAccountV1': 'Delete user account permanently',
      'addInternalNoteV1': 'Add internal note for agent reference',
      'addSystemNoteV1': 'Add system-generated note',
      'sendEmailV1': 'Send email to user',
      'addUserTagV1': 'Add tag to user profile',
      'removeUserTagV1': 'Remove tag from user profile',
      'switchPaymentMethodV1': 'Switch payment method for transaction',
      'createCaseV1': 'Create new support case',
      'escalateContactV1': 'Escalate contact to higher tier',
      'transferChatV1': 'Transfer chat to another agent or team'
    };

    return descriptions[actionType] || `Execute ${actionType} action`;
  }

  // Create action object in the specified format
  createActionObject(actionType, actionData, argumentValues = {}, constants = {}, description = null) {
    const action = {
      actionType: actionType,
      arguments: {},
      constants: {},
      description: description || this.generateDescription(actionType, actionData),
      descriptionTemplateCalculators: {},
      idempotenceType: null,
      name: "",
      shouldSkip: null,
      descriptionRosettaKey: null
    };

    // Populate required arguments
    if (actionData.requiredArguments) {
      actionData.requiredArguments.forEach(arg => {
        action.arguments[arg.name] = argumentValues[arg.name] || this.generateUUID();
      });
    }

    // Populate optional arguments into constants
    if (actionData.optionalArguments) {
      actionData.optionalArguments.forEach(arg => {
        if (argumentValues[arg.name]) {
          action.arguments[arg.name] = argumentValues[arg.name];
        } else {
          // Add optional parameter to constants with comment
          action.constants[arg.name] = ""; //optional parameter
        }
      });
    }

    return action;
  }

  // Find action by type name
  findActionByType(actionType) {
    if (!this.atlasData || !this.atlasData.result) {
      throw new Error('Atlas data not loaded');
    }

    return this.atlasData.result.find(action => action.type === actionType);
  }

  // Search actions by partial name or description
  searchActions(query) {
    if (!this.atlasData || !this.atlasData.result) {
      throw new Error('Atlas data not loaded');
    }

    const lowerQuery = query.toLowerCase();
    return this.atlasData.result.filter(action => 
      action.type.toLowerCase().includes(lowerQuery) ||
      this.generateDescription(action.type, action).toLowerCase().includes(lowerQuery)
    );
  }

  // Generate action array for specific use cases
  generateActionArray(actionTypes, scenario = 'default') {
    const actions = [];

    actionTypes.forEach(actionConfig => {
      let actionType, argumentValues, constants, description;

      if (typeof actionConfig === 'string') {
        actionType = actionConfig;
        argumentValues = {};
        constants = {};
        description = null;
      } else {
        actionType = actionConfig.type;
        argumentValues = actionConfig.arguments || {};
        constants = actionConfig.constants || {};
        description = actionConfig.description || null;
      }

      const actionData = this.findActionByType(actionType);
      if (!actionData) {
        console.warn(`Action type ${actionType} not found in atlas data`);
        return;
      }

      const action = this.createActionObject(actionType, actionData, argumentValues, constants, description);
      actions.push(action);
    });

    return actions;
  }

  // Predefined scenarios for common use cases
  getScenarioActions(scenarioName) {
    const scenarios = {
      'food_tampering_resolution': [
        {
          type: 'updateContactTypeV1',
          constants: { ContactTypeID: 'ed83fbbf-01bc-4bfc-a200-2ee8d4ae7368' },
          description: 'Route to food safety specialist'
        },
        {
          type: 'applyResolutionV1',
          constants: {
            SaveResolutionOnly: 'false',
            ShouldCheckEligibility: 'true',
            IssueType: 'FOOD_SAFETY',
            PalantirActionType: 'REFUND',
            Reason: 'FOOD_TAMPERING',
            RefundType: 'REFUND_TO_ORIGINAL_PAYMENT'
          },
          description: 'Apply full refund for food tampering incident'
        },
        {
          type: 'addMessageV1',
          constants: {
            Locale: 'en',
            MacroID: '40dcbd63-474b-478a-9dc1-7a0d1742d657'
          },
          description: 'Send acknowledgment message for food tampering report'
        },
        {
          type: 'updateContactStatusV1',
          constants: { Status: 'SOLVED' },
          description: 'Mark contact as resolved'
        }
      ],

      'account_security_issue': [
        {
          type: 'accountLockdownV1',
          constants: { SendNotifyEmail: 'true', SendNotifySMS: 'true' },
          description: 'Lock account and notify user via email and SMS'
        },
        {
          type: 'addUserNoteV1',
          constants: { Tenancy: 'security' },
          description: 'Add security incident note to user profile'
        },
        {
          type: 'updateContactTierV1',
          constants: { EscalationReason: 'Security Incident', Tier: 'TIER3' },
          description: 'Escalate to security team'
        }
      ],

      'fare_adjustment': [
        {
          type: 'adjustFareV1',
          constants: {
            Reason: 'ROUTE_DEVIATION',
            RefundStrategy: 'IMMEDIATE',
            TransactionCategory: 'FARE_ADJUSTMENT'
          },
          description: 'Adjust fare due to route deviation'
        },
        {
          type: 'addTripNoteV1',
          constants: { Tenancy: 'operations' },
          description: 'Add note explaining fare adjustment'
        },
        {
          type: 'sendNotificationV1',
          constants: { ForceSendNotification: 'true' },
          description: 'Notify user of fare adjustment'
        }
      ],

      'customer_refund': [
        {
          type: 'updateContactTypeV1',
          constants: { ContactTypeID: 'refund-specialist' },
          description: 'Route to refund specialist'
        },
        {
          type: 'refundEaterV1',
          constants: {
            OrderIssueType: 'QUALITY_ISSUE',
            RefundStrategy: 'IMMEDIATE',
            TransactionCategory: 'CUSTOMER_REFUND'
          },
          description: 'Process customer refund for order issue'
        },
        {
          type: 'addMessageV1',
          constants: { Locale: 'en' },
          description: 'Send refund confirmation message'
        },
        {
          type: 'updateContactStatusV1',
          constants: { Status: 'SOLVED' },
          description: 'Mark refund request as resolved'
        }
      ]
    };

    return scenarios[scenarioName] || [];
  }

  // Main method to get actions based on user request
  getActions(request) {
    const requestLower = request.toLowerCase();

    // Check for predefined scenarios
    if (requestLower.includes('food') && (requestLower.includes('tamper') || requestLower.includes('safety'))) {
      return this.generateActionArray(this.getScenarioActions('food_tampering_resolution'));
    }
    
    if (requestLower.includes('security') || (requestLower.includes('account') && requestLower.includes('lock'))) {
      return this.generateActionArray(this.getScenarioActions('account_security_issue'));
    }
    
    if (requestLower.includes('fare') && requestLower.includes('adjust')) {
      return this.generateActionArray(this.getScenarioActions('fare_adjustment'));
    }

    if (requestLower.includes('refund') || requestLower.includes('money back')) {
      return this.generateActionArray(this.getScenarioActions('customer_refund'));
    }

    // Search for specific actions
    const searchResults = this.searchActions(request);
    if (searchResults.length > 0) {
      return this.generateActionArray(searchResults.slice(0, 3).map(action => action.type));
    }

    return [];
  }

  // List all available action types
  listAllActions() {
    if (!this.atlasData || !this.atlasData.result) {
      return [];
    }

    return this.atlasData.result.map(action => ({
      type: action.type,
      description: this.generateDescription(action.type, action),
      requiredArgs: action.requiredArguments.length,
      optionalArgs: action.optionalArguments.length
    }));
  }
}

// Browser-compatible export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ActionGenerator };
} else if (typeof window !== 'undefined') {
  window.ActionGenerator = ActionGenerator;
} 