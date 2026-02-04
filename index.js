#!/usr/bin/env node

var slaWizardInternal = require("./src/index.js");

/**
 * Main function for sla-wizard.
 * Calling slaWizard(proxy, options) is equivalent to slaWizardInternal.config(proxy, options).
 */
var slaWizard = function () {
    return slaWizardInternal.config.apply(null, arguments);
};

// Attach all exported methods to slaWizard (config, runTest, configNginxConfd, etc.)
Object.assign(slaWizard, slaWizardInternal);

// Enable CLI execution when run directly
if (require.main === module) {
    slaWizardInternal.runCLI();
}

module.exports = slaWizard;
