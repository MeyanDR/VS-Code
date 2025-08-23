/* ========================================== */
/*         TROMKLUB COMPATIBILITY LAYER       */
/*      For Legacy index.html Support        */
/* ========================================== */

// Import all modules
import './core.js';
import './renderer.js'; 
import './ui.js';
import './utils.js';

// Override emergency stubs with real functions once modules load
setTimeout(() => {
    console.log('Loading TROMKLUB modules...');
    
    // Wait a bit more for modules to initialize
    setTimeout(() => {
        // Force update all global functions
        if (window.sections && window.getCurrentSection) {
            console.log('TROMKLUB modules loaded successfully!');
            
            // Initialize UI
            if (typeof window.initializeUI === 'function') {
                try {
                    window.initializeUI();
                } catch (error) {
                    console.error('UI initialization error:', error);
                }
            }
            
            // Update grid
            if (typeof window.updateGrid === 'function') {
                try {
                    window.updateGrid();
                } catch (error) {
                    console.error('Grid update error:', error);
                }
            }
            
            // Render sequencer
            if (typeof window.renderSequencer === 'function') {
                try {
                    window.renderSequencer();
                } catch (error) {
                    console.error('Sequencer render error:', error);
                }
            }
            
        } else {
            console.error('Failed to load TROMKLUB core modules');
        }
    }, 500);
}, 100);

console.log('TROMKLUB compatibility layer loaded');