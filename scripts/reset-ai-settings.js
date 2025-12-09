/**
 * Quick Fix Script - Run this in Browser Console
 * This will clear old AI settings and initialize with OpenRouter
 */

// Clear old AI settings
localStorage.removeItem('siifmart_ai_provider');
localStorage.removeItem('siifmart_ai_keys');

// Set OpenRouter as provider with pre-configured key
localStorage.setItem('siifmart_ai_provider', 'openrouter');

const keys = {
    openrouter: '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',
    huggingface: '',
    groq: '',
    offline: 'N/A'
};

localStorage.setItem('siifmart_ai_keys', JSON.stringify(keys));

console.log('✅ AI settings reset!');
console.log('🔄 Reloading page...');

// Reload the page
location.reload();
