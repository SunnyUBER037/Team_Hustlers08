#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');

// ANSI color codes for better CLI experience
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

class InteractiveActionSystem {
  constructor() {
    this.atlasData = null;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.loadAtlasData();
  }

  loadAtlasData() {
    try {
      const rawData = fs.readFileSync('./atlas.json', 'utf8');
      this.atlasData = JSON.parse(rawData);
      console.log(`✅ Loaded ${this.atlasData.result.length} actions from atlas.json`);
    } catch (error) {
      console.error('❌ Error loading atlas.json:', error.message);
      process.exit(1);
    }
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  findActionByType(actionType) {
    return this.atlasData.result.find(action => action.type === actionType);
  }

  createActionObject(actionType, actionData, argumentValues = {}, constants = {}, description = null) {
    const action = {
      actionType: actionType,
      arguments: {},
      constants: constants,
      description: description || `Execute ${actionType} action`,
      descriptionTemplateCalculators: {},
      idempotenceType: null,
      name: "",
      shouldSkip: null,
      descriptionRosettaKey: null
    };

    if (actionData.requiredArguments) {
      actionData.requiredArguments.forEach(arg => {
        action.arguments[arg.name] = argumentValues[arg.name] || this.generateUUID();
      });
    }

    return action;
  }

  generateActionsForQuery(query) {
    const queryLower = query.toLowerCase();
    let actionConfigs = [];

    // Food related issues
    if (queryLower.includes('food') && (queryLower.includes('tamper') || queryLower.includes('safety') || queryLower.includes('quality'))) {
      actionConfigs = [
        {
          type: 'updateContactTypeV1',
          constants: { ContactTypeID: 'food-safety-specialist' },
          description: 'Route to food safety specialist team'
        },
        {
          type: 'applyResolutionV1',
          constants: {
            SaveResolutionOnly: 'false',
            ShouldCheckEligibility: 'true',
            IssueType: 'FOOD_SAFETY',
            PalantirActionType: 'REFUND',
            Reason: 'FOOD_ISSUE',
            RefundType: 'REFUND_TO_ORIGINAL_PAYMENT'
          },
          description: 'Apply food safety resolution with refund'
        },
        {
          type: 'addMessageV1',
          constants: { Locale: 'en', MacroID: 'food-safety-macro' },
          description: 'Send food safety acknowledgment message'
        },
        {
          type: 'updateContactStatusV1',
          constants: { Status: 'SOLVED' },
          description: 'Mark food safety issue as resolved'
        }
      ];
    }
    // Refund requests
    else if (queryLower.includes('refund') || queryLower.includes('money back')) {
      actionConfigs = [
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
          description: 'Process customer refund'
        },
        {
          type: 'addMessageV1',
          constants: { Locale: 'en' },
          description: 'Send refund confirmation message'
        },
        {
          type: 'updateContactStatusV1',
          constants: { Status: 'SOLVED' },
          description: 'Mark refund as processed'
        }
      ];
    }
    // Account/Security issues
    else if (queryLower.includes('account') || queryLower.includes('security') || queryLower.includes('hack') || queryLower.includes('lock')) {
      actionConfigs = [
        {
          type: 'accountLockdownV1',
          constants: { SendNotifyEmail: 'true', SendNotifySMS: 'true' },
          description: 'Lock account for security'
        },
        {
          type: 'addUserNoteV1',
          constants: { Tenancy: 'security' },
          description: 'Add security incident note'
        },
        {
          type: 'updateContactTierV1',
          constants: { EscalationReason: 'Security Incident', Tier: 'TIER3' },
          description: 'Escalate to security team'
        }
      ];
    }
    // Trip/Fare issues
    else if (queryLower.includes('trip') || queryLower.includes('fare') || queryLower.includes('ride') || queryLower.includes('driver')) {
      actionConfigs = [
        {
          type: 'adjustFareV1',
          constants: {
            Reason: 'TRIP_ISSUE',
            RefundStrategy: 'IMMEDIATE',
            TransactionCategory: 'FARE_ADJUSTMENT'
          },
          description: 'Adjust fare for trip issue'
        },
        {
          type: 'addTripNoteV1',
          constants: { Tenancy: 'operations' },
          description: 'Add trip issue note'
        },
        {
          type: 'sendNotificationV1',
          constants: { ForceSendNotification: 'true' },
          description: 'Notify user of resolution'
        }
      ];
    }
    // Support requests
    else if (queryLower.includes('support') || queryLower.includes('help') || queryLower.includes('issue')) {
      actionConfigs = [
        {
          type: 'createCaseV1',
          constants: { CaseType: 'GENERAL_SUPPORT' },
          description: 'Create support case'
        },
        {
          type: 'updateContactTypeV1',
          constants: { ContactTypeID: 'general-support' },
          description: 'Route to support team'
        },
        {
          type: 'addInternalNoteV1',
          constants: { Source: 'AGENT_CREATED' },
          description: 'Add support request note'
        }
      ];
    }
    // Status updates
    else if (queryLower.includes('status') || queryLower.includes('update')) {
      actionConfigs = [
        {
          type: 'updateContactStatusV1',
          constants: { Status: 'IN_PROGRESS' },
          description: 'Update contact status'
        },
        {
          type: 'addSystemNoteV1',
          constants: { SystemAction: 'STATUS_UPDATE' },
          description: 'Add status update note'
        },
        {
          type: 'sendNotificationV1',
          constants: { NotificationType: 'STATUS_UPDATE' },
          description: 'Send status notification'
        }
      ];
    }
    // Default search in atlas
    else {
      const searchResults = this.searchActions(query);
      if (searchResults.length > 0) {
        actionConfigs = searchResults.slice(0, 3).map(action => ({
          type: action.type,
          description: `Execute ${action.type} action`
        }));
      }
    }

    const actions = [];
    actionConfigs.forEach(config => {
      const actionData = this.findActionByType(config.type);
      if (actionData) {
        const action = this.createActionObject(
          config.type,
          actionData,
          config.arguments || {},
          config.constants || {},
          config.description
        );
        actions.push(action);
      }
    });

    return actions;
  }

  searchActions(query) {
    const lowerQuery = query.toLowerCase();
    return this.atlasData.result.filter(action => 
      action.type.toLowerCase().includes(lowerQuery)
    );
  }

  getPolicyBasedResolution(actions, policy) {
    const resolutions = {
      eater: {
        food: "For eaters experiencing food issues, we prioritize immediate refunds and credits to ensure customer satisfaction and safety.",
        refund: "Eater refunds are processed immediately with full compensation plus additional credits for inconvenience.",
        account: "Eater account security is handled with priority support and immediate protective measures.",
        trip: "Trip issues for eaters result in fare adjustments and service credits.",
        default: "Eater issues are resolved with customer-first approach including refunds, credits, and priority support."
      },
      rider: {
        food: "Rider food delivery issues are addressed with compensation and driver performance review.",
        refund: "Rider refunds include trip fare adjustments and potential credits for future rides.",
        account: "Rider account security involves immediate lockdown and identity verification processes.",
        trip: "Trip issues for riders are resolved through fare adjustments and driver accountability measures.",
        default: "Rider issues are handled with focus on safety, fair compensation, and service reliability."
      },
      merchant: {
        food: "Merchant food safety issues trigger immediate investigation and potential partnership review.",
        refund: "Merchant-related refunds may impact merchant ratings and require process improvements.",
        account: "Merchant account security involves business verification and enhanced protection measures.",
        trip: "Merchant delivery issues are addressed through driver training and process optimization.",
        default: "Merchant issues are resolved through partnership collaboration and service improvement measures."
      }
    };

    // Determine issue type from actions
    let issueType = 'default';
    const actionTypes = actions.map(a => a.actionType.toLowerCase()).join(' ');
    
    if (actionTypes.includes('food') || actionTypes.includes('eater')) issueType = 'food';
    else if (actionTypes.includes('refund')) issueType = 'refund';
    else if (actionTypes.includes('account') || actionTypes.includes('security')) issueType = 'account';
    else if (actionTypes.includes('trip') || actionTypes.includes('fare')) issueType = 'trip';

    return resolutions[policy][issueType];
  }

  async askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  async processUserQuery() {
    console.log('\n🚀 Interactive Action System Started!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    while (true) {
      try {
        // Get user query
        console.log('\n💬 Ask me about any action you need:');
        console.log('   Examples: "food tampering", "refund customer", "account security", "trip issue"');
        const userQuery = await this.askQuestion('👤 Your query (or "exit" to quit): ');
        
        if (userQuery.toLowerCase() === 'exit') {
          console.log('\n👋 Goodbye!');
          break;
        }

        if (!userQuery) {
          console.log('❌ Please enter a valid query.');
          continue;
        }

        // Generate actions
        console.log(`\n🔍 Processing query: "${userQuery}"`);
        const actions = this.generateActionsForQuery(userQuery);

        if (actions.length === 0) {
          console.log('❌ No actions found for your query. Try: food issue, refund, account security, trip problem');
          continue;
        }

        // Display generated actions
        console.log(`\n✅ Generated ${actions.length} actions:`);
        actions.forEach((action, index) => {
          console.log(`   ${index + 1}. ${action.description}`);
        });

        // Ask for policy
        console.log('\n📋 Policy clarification needed:');
        const policy = await this.askQuestion('🎯 Is this for eater, rider, or merchant? (e/r/m): ');
        
        let policyType;
        switch (policy.toLowerCase()) {
          case 'e': case 'eater': policyType = 'eater'; break;
          case 'r': case 'rider': policyType = 'rider'; break;
          case 'm': case 'merchant': policyType = 'merchant'; break;
          default: 
            console.log('❌ Invalid policy. Using default policy.');
            policyType = 'eater';
        }

        // Get resolution
        const resolution = this.getPolicyBasedResolution(actions, policyType);

        // Display results
        console.log('\n📊 FINAL RESULTS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🎯 Policy: ${policyType.toUpperCase()}`);
        console.log(`💡 Resolution: ${resolution}`);
        
        console.log('\n🔧 Actions to execute:');
        console.log(JSON.stringify({ actions }, null, 2));

        // Ask if user wants to continue
        const continueChoice = await this.askQuestion('\n❓ Process another query? (y/n): ');
        if (continueChoice.toLowerCase() !== 'y' && continueChoice.toLowerCase() !== 'yes') {
          console.log('\n👋 Session ended. Goodbye!');
          break;
        }

      } catch (error) {
        console.error('❌ Error processing query:', error.message);
      }
    }

    this.rl.close();
  }
}

// CLI execution
if (require.main === module) {
  const system = new InteractiveActionSystem();
  system.processUserQuery().catch(console.error);
}

module.exports = InteractiveActionSystem; 