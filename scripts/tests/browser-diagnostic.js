// Test script to check what DataContext is loading
// Run this in the browser console on http://localhost:3002

console.log('🔍 SIIFMART Data Loading Diagnostic');
console.log('====================================\n');

// Check if DataContext is available
const checkDataContext = () => {
    // Try to access the React DevTools
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        console.log('✅ React DevTools detected');
    }

    // Check localStorage
    console.log('\n📦 LocalStorage Check:');
    const keys = Object.keys(localStorage);
    console.log('Keys:', keys);
    keys.forEach(key => {
        if (key.includes('siifmart') || key.includes('employee')) {
            console.log(`  ${key}:`, localStorage.getItem(key)?.substring(0, 100));
        }
    });

    // Check sessionStorage
    console.log('\n📦 SessionStorage Check:');
    const sessionKeys = Object.keys(sessionStorage);
    console.log('Keys:', sessionKeys);

    // Check for Supabase auth
    console.log('\n🔐 Supabase Auth Check:');
    const authKeys = keys.filter(k => k.includes('supabase'));
    authKeys.forEach(key => {
        console.log(`  ${key}: exists`);
    });
};

checkDataContext();

console.log('\n📝 Instructions:');
console.log('1. Open React DevTools');
console.log('2. Find the DataProvider component');
console.log('3. Check the "employees" state value');
console.log('4. If empty, check console for loading errors');
