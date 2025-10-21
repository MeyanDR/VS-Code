// Test script to verify NEW_PROJECT action
// Run this in the browser console to test

// 1. Check initial state after clicking "New"
console.log('Testing NEW_PROJECT action...');

// 2. Get current state
const getState = () => {
  const stateElement = document.querySelector('[data-testid="debug-state"]');
  if (stateElement) {
    return JSON.parse(stateElement.textContent);
  } else {
    console.log('State not accessible via debug element');
    console.log('Testing manually: Click "New" button and check:');
    console.log('- Should have 1 instrument: "Instrument 1"');
    console.log('- Grid should be: 4 bars, 4 beats, 4 subdivisions');
    console.log('- Should have only "Intro" section');
    console.log('- All notes should be cleared');
    console.log('- UI state should be reset');
  }
};

// 3. Instructions for manual testing
console.log('\n=== MANUAL TEST INSTRUCTIONS ===');
console.log('1. Add some notes to the grid');
console.log('2. Add extra instruments');
console.log('3. Change grid settings');
console.log('4. Add more sections');
console.log('5. Click "New" button');
console.log('6. Verify:');
console.log('   - Only 1 instrument: "Instrument 1"');
console.log('   - Grid: 4/4/4');
console.log('   - Only "Intro" section');
console.log('   - All notes cleared');
console.log('   - UI reset to defaults');
console.log('\n7. Then click "Clear" button');
console.log('8. Verify:');
console.log('   - Only notes are cleared');
console.log('   - Instruments, sections, grid remain the same');