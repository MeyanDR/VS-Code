// Test script to verify save/load functionality
// Run this in browser console at http://localhost:3000

const testSaveLoad = async () => {
  console.log('Testing Save/Load functionality...\n');
  
  // Import project manager
  const { projectManager } = await import('/src/services/ProjectManager.js');
  
  // Test data
  const testProject = {
    patterns: { 
      'test-pattern': {
        id: 'test-pattern',
        name: 'Test Pattern',
        bars: []
      }
    },
    instruments: ['Kick', 'Snare'],
    timestamp: Date.now()
  };
  
  // Test 1: Save project
  console.log('1. Testing Save...');
  const saveResult = projectManager.saveProject(testProject, {
    name: 'Test Project ' + Date.now(),
    description: 'Testing save functionality'
  });
  
  if (saveResult.success) {
    console.log('✅ Save successful:', saveResult.projectId);
  } else {
    console.error('❌ Save failed:', saveResult.error);
    return;
  }
  
  // Test 2: Load project
  console.log('\n2. Testing Load...');
  const loadResult = projectManager.loadProject(saveResult.projectId);
  
  if (loadResult.success) {
    console.log('✅ Load successful');
    console.log('Project data:', loadResult.project);
    console.log('Metadata:', loadResult.metadata);
    
    // Verify data integrity
    if (JSON.stringify(loadResult.project) === JSON.stringify(testProject)) {
      console.log('✅ Data integrity verified');
    } else {
      console.error('❌ Data mismatch after load');
    }
  } else {
    console.error('❌ Load failed:', loadResult.error);
  }
  
  // Test 3: List all projects
  console.log('\n3. Listing all projects...');
  const allProjects = projectManager.getAllProjects();
  console.log(`Found ${allProjects.length} projects`);
  allProjects.forEach(p => {
    console.log(`- ${p.name} (${p.id})`);
  });
  
  // Test 4: Storage info
  console.log('\n4. Storage Info:');
  const storageInfo = projectManager.getStorageInfo();
  console.log(`App storage: ${storageInfo.usedKB} KB / ${storageInfo.availableMB} MB (${storageInfo.percentage}%)`);
  
  const browserInfo = projectManager.getBrowserStorageInfo();
  if (browserInfo) {
    console.log(`Total browser storage: ${browserInfo.browserTotalKB} KB`);
    console.log(`This app: ${browserInfo.appUsedKB} KB`);
    console.log(`Other apps: ${browserInfo.otherAppsKB} KB`);
  }
  
  console.log('\n✅ All tests completed!');
};

// Run the test
testSaveLoad().catch(console.error);