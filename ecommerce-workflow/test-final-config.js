const { config } = require('./src/config');

console.log('=== Configuration Test ===');
console.log('Environment Variables:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  UPSELL_ENABLED:', process.env.UPSELL_ENABLED);
console.log('  SUMMER10_ENABLED:', process.env.SUMMER10_ENABLED);

console.log('\nParsed Configuration:');
console.log('  upsellEnabled:', config.features.upsellEnabled);
console.log('  summer10Enabled:', config.features.summer10Enabled);
console.log('  vatRate:', config.business.vatRate);

console.log('\nConfiguration Types:');
console.log('  typeof upsellEnabled:', typeof config.features.upsellEnabled);
console.log('  typeof summer10Enabled:', typeof config.features.summer10Enabled);

console.log('\nTest Complete!');
