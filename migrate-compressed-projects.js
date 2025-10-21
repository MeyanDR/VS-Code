// Script to migrate any existing compressed projects to uncompressed format
// Run this in browser console at http://localhost:3000

const migrateCompressedProjects = async () => {
  console.log('Checking for compressed projects to migrate...\n');
  
  try {
    // Get raw data from localStorage
    const projectsData = localStorage.getItem('tromklub_projects');
    
    if (!projectsData) {
      console.log('No projects found in localStorage');
      return;
    }
    
    const projects = JSON.parse(projectsData);
    console.log(`Found ${projects.length} projects`);
    
    let migratedCount = 0;
    const migratedProjects = projects.map(project => {
      if (project.compressed && typeof project.data === 'string') {
        console.log(`Found compressed project: ${project.name}`);
        
        try {
          // Try to decompress using LZ-string if it's still available
          if (typeof LZString !== 'undefined') {
            const decompressed = LZString.decompressFromUTF16(project.data);
            if (decompressed) {
              const parsedData = JSON.parse(decompressed);
              migratedCount++;
              return {
                ...project,
                data: parsedData,
                compressed: undefined // Remove compressed flag
              };
            }
          }
        } catch (e) {
          console.error(`Failed to decompress ${project.name}:`, e);
          // If decompression fails, try to parse as regular JSON
          try {
            const parsedData = JSON.parse(project.data);
            migratedCount++;
            return {
              ...project,
              data: parsedData,
              compressed: undefined
            };
          } catch (e2) {
            console.error(`Failed to parse ${project.name} as JSON:`, e2);
          }
        }
      }
      
      // Return project as-is if not compressed or migration failed
      return project;
    });
    
    if (migratedCount > 0) {
      // Save migrated projects back to localStorage
      localStorage.setItem('tromklub_projects', JSON.stringify(migratedProjects));
      console.log(`\n✅ Successfully migrated ${migratedCount} compressed projects`);
    } else {
      console.log('\n✅ No compressed projects found - all projects are already in uncompressed format');
    }
    
    // Show current storage usage
    const storageUsed = new Blob([JSON.stringify(migratedProjects)]).size;
    console.log(`\nCurrent project storage: ${(storageUsed / 1024).toFixed(1)} KB`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

// Run the migration
migrateCompressedProjects();