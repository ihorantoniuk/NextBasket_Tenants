// Simple script to test configuration loading
require('dotenv').config();

console.log('=== Environment Variables ===');
console.log('UPSELL_ENABLED:', process.env.UPSELL_ENABLED);
console.log('UPSELL_ENABLED type:', typeof process.env.UPSELL_ENABLED);
console.log('NODE_ENV:', process.env.NODE_ENV);

console.log('\n=== Configuration Processing ===');
const upsellEnabled = process.env.UPSELL_ENABLED === 'true' || 
                     process.env.UPSELL_ENABLED?.toLowerCase() === 'true' ||
                     (process.env.UPSELL_ENABLED || '').toLowerCase().trim() === 'true' ||
                     true; // Fallback to always enabled

console.log('Computed upsellEnabled:', upsellEnabled);
console.log('upsellEnabled type:', typeof upsellEnabled);

// Test individual conditions
console.log('\n=== Individual Condition Tests ===');
console.log('UPSELL_ENABLED === "true":', process.env.UPSELL_ENABLED === 'true');
console.log('UPSELL_ENABLED?.toLowerCase() === "true":', process.env.UPSELL_ENABLED?.toLowerCase() === 'true');
console.log('(UPSELL_ENABLED || "").toLowerCase().trim() === "true":', (process.env.UPSELL_ENABLED || '').toLowerCase().trim() === 'true');
