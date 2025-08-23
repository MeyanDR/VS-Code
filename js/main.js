/**
 * Main Application Entry Point
 * TROMKLUB Machine - Refactored Version
 */

import store, { actions } from './state/store.js';
import { LAYOUT, LayoutHelpers } from './config/layout.js';
import { THEMES, ThemeHelpers } from './config/themes.js';
import DOM from './utils/dom-helpers.js';

// Application class
class TromklubApp {
    constructor() {
        this.store = store;
        this.layout = LAYOUT;
        this.themes = THEMES;
        this.initialized = false;
        
        // Bind methods
        this.init = this.init.bind(this);
        this.setupEventListeners = this.setupEventListeners.bind(this);
        this.render = this.render.bind(this);
    }
    
    /**
     * Initialize the application
     */
    async init() {
        if (this.initialized) return;
        
        console.log('🥁 TROMKLUB Machine - Initializing...');
        
        try {
            // Apply default theme
            this.applyDefaultTheme();
            
            // Setup UI event listeners
            this.setupEventListeners();
            
            // Subscribe to state changes
            this.store.subscribe((state, action) => {
                console.log('State changed:', action.type);
                this.render(state);
            });
            
            // Load saved project if exists
            this.loadSavedProject();
            
            // Initial render
            this.render(this.store.getState());
            
            // Initialize default project if needed
            if (!this.store.get('project.sections').length) {
                this.createDefaultProject();
            }
            
            this.initialized = true;
            console.log('✅ TROMKLUB Machine - Ready!');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize application');
        }
    }
    
    /**
     * Apply default theme on startup
     */
    applyDefaultTheme() {
        const defaultTheme = ThemeHelpers.getDefaultTheme();
        Object.assign(LAYOUT.fonts, defaultTheme.fonts);
        Object.assign(LAYOUT.grid, defaultTheme.grid);
    }
    
    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Symbol selection
        DOM.on(document, 'click', (e) => {
            if (e.target.matches('.note-symbol')) {
                this.handleSymbolClick(e.target);
            }
            if (e.target.matches('.note-modifier')) {
                this.handleModifierClick(e.target);
            }
            if (e.target.matches('.step')) {
                this.handleStepClick(e);
            }
        });
        
        // Control buttons
        const setupButton = (selector, handler) => {
            const btn = DOM.$(selector);
            if (btn) DOM.on(btn, 'click', handler);
        };
        
        setupButton('#playBtn', () => this.togglePlayback());
        setupButton('#stopBtn', () => this.stopPlayback());
        setupButton('#clearBtn', () => this.clearAll());
        setupButton('#undoBtn', () => this.undo());
        setupButton('#redoBtn', () => this.redo());
        setupButton('#saveBtn', () => this.saveProject());
        setupButton('#loadBtn', () => this.loadProject());
        setupButton('#exportBtn', () => this.openExportModal());
        
        // Keyboard shortcuts
        DOM.on(document, 'keydown', (e) => this.handleKeyboard(e));
        
        // Prevent text selection during drag
        DOM.on(document, 'selectstart', (e) => {
            if (this.store.get('ui.isDragging')) {
                e.preventDefault();
            }
        });
    }
    
    /**
     * Handle symbol click
     */
    handleSymbolClick(element) {
        const symbol = element.textContent;
        this.store.dispatch(actions.setActiveSymbol(symbol));
        
        // Update UI
        DOM.$$('.note-symbol.active').forEach(el => {
            DOM.removeClass(el, 'active');
        });
        DOM.addClass(element, 'active');
        
        this.updatePreview();
    }
    
    /**
     * Handle modifier click
     */
    handleModifierClick(element) {
        const modifier = element.textContent;
        const currentModifier = this.store.get('ui.activeModifier');
        
        if (currentModifier === modifier) {
            // Toggle off
            this.store.dispatch(actions.setActiveModifier(''));
            DOM.removeClass(element, 'active');
        } else {
            // Set new modifier
            this.store.dispatch(actions.setActiveModifier(modifier));
            
            // Update UI
            DOM.$$('.note-modifier.active').forEach(el => {
                DOM.removeClass(el, 'active');
            });
            DOM.addClass(element, 'active');
        }
        
        this.updatePreview();
    }
    
    /**
     * Handle step click
     */
    handleStepClick(event) {
        const step = event.target.closest('.step');
        if (!step) return;
        
        const state = this.store.getState();
        const stepId = step.dataset.stepId;
        
        if (event.shiftKey && state.ui.selectionAnchor) {
            // Range selection
            this.selectRange(state.ui.selectionAnchor, stepId);
        } else if (event.ctrlKey || event.metaKey) {
            // Toggle selection
            if (state.ui.selectedSteps.has(stepId)) {
                this.store.dispatch(actions.removeFromSelection([stepId]));
            } else {
                this.store.dispatch(actions.addToSelection([stepId]));
            }
        } else {
            // Single selection or toggle
            this.toggleStep(step);
        }
    }
    
    /**
     * Toggle step active state
     */
    toggleStep(stepElement) {
        const isActive = DOM.hasClass(stepElement, 'active');
        const state = this.store.getState();
        
        if (isActive) {
            // Clear the step
            DOM.removeClass(stepElement, 'active');
            DOM.setContent(stepElement, '');
        } else {
            // Set the step with current symbol and modifier
            const symbol = state.ui.activeSymbol;
            const modifier = state.ui.activeModifier;
            
            DOM.addClass(stepElement, 'active');
            
            // Create step content
            const content = DOM.createElement('div', { className: 'step-content' }, [
                DOM.createElement('span', { className: 'step-main' }, [symbol])
            ]);
            
            if (modifier) {
                const modElement = DOM.createElement('span', { className: 'step-sub' }, [modifier]);
                content.appendChild(modElement);
            }
            
            DOM.setContent(stepElement, content);
        }
        
        // Save to history
        this.saveState();
    }
    
    /**
     * Handle keyboard shortcuts
     */
    handleKeyboard(event) {
        const key = event.key.toLowerCase();
        const ctrl = event.ctrlKey || event.metaKey;
        
        if (ctrl) {
            switch(key) {
                case 'z':
                    event.preventDefault();
                    this.undo();
                    break;
                case 'y':
                    event.preventDefault();
                    this.redo();
                    break;
                case 's':
                    event.preventDefault();
                    this.saveProject();
                    break;
                case 'o':
                    event.preventDefault();
                    this.loadProject();
                    break;
                case 'a':
                    event.preventDefault();
                    this.selectAll();
                    break;
                case 'c':
                    event.preventDefault();
                    this.copy();
                    break;
                case 'x':
                    event.preventDefault();
                    this.cut();
                    break;
                case 'v':
                    event.preventDefault();
                    this.paste();
                    break;
            }
        } else if (key === 'escape') {
            this.clearSelection();
        } else if (key === ' ') {
            event.preventDefault();
            this.togglePlayback();
        }
    }
    
    /**
     * Update symbol preview
     */
    updatePreview() {
        const preview = DOM.$('.symbol-preview');
        if (!preview) return;
        
        const state = this.store.getState();
        const symbol = state.ui.activeSymbol;
        const modifier = state.ui.activeModifier;
        
        let content = symbol;
        if (modifier) {
            content = `${symbol}<sub>${modifier}</sub>`;
        }
        
        preview.innerHTML = content;
    }
    
    /**
     * Main render function
     */
    render(state) {
        // This would normally update the entire UI based on state
        // For now, just log
        console.log('Rendering with state:', state);
    }
    
    /**
     * Playback controls
     */
    togglePlayback() {
        this.store.dispatch(actions.togglePlayback());
    }
    
    stopPlayback() {
        this.store.dispatch(actions.setPlayback({ isPlaying: false }));
    }
    
    /**
     * History management
     */
    undo() {
        this.store.dispatch(actions.undo());
    }
    
    redo() {
        this.store.dispatch(actions.redo());
    }
    
    saveState() {
        // State is automatically saved by the store
    }
    
    /**
     * Project management
     */
    saveProject() {
        const state = this.store.getState();
        const projectData = JSON.stringify(state.project);
        localStorage.setItem('tromklub_project', projectData);
        this.showToast('Project saved');
    }
    
    loadProject() {
        const input = DOM.createElement('input', {
            type: 'file',
            accept: '.json',
            onchange: (e) => this.handleFileLoad(e)
        });
        input.click();
    }
    
    loadSavedProject() {
        const saved = localStorage.getItem('tromklub_project');
        if (saved) {
            try {
                const project = JSON.parse(saved);
                this.store.dispatch(actions.setProject(project));
            } catch (error) {
                console.error('Failed to load saved project:', error);
            }
        }
    }
    
    handleFileLoad(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const project = JSON.parse(e.target.result);
                this.store.dispatch(actions.setProject(project));
                this.showToast('Project loaded');
            } catch (error) {
                this.showError('Invalid project file');
            }
        };
        reader.readAsText(file);
    }
    
    /**
     * Create default project structure
     */
    createDefaultProject() {
        const defaultSection = {
            name: 'Intro',
            bars: [{
                instruments: [
                    { name: 'Kick', beats: [] },
                    { name: 'Snare', beats: [] },
                    { name: 'Hi-Hat', beats: [] }
                ]
            }],
            notes: ''
        };
        
        this.store.dispatch(actions.addSection(defaultSection));
    }
    
    /**
     * Clear all steps
     */
    clearAll() {
        if (confirm('Clear all steps? This cannot be undone.')) {
            DOM.$$('.step.active').forEach(step => {
                DOM.removeClass(step, 'active');
                DOM.setContent(step, '');
            });
            this.saveState();
        }
    }
    
    /**
     * Selection management
     */
    selectAll() {
        const allSteps = DOM.$$('.step').map(el => el.dataset.stepId);
        this.store.dispatch(actions.setSelection(allSteps));
    }
    
    clearSelection() {
        this.store.dispatch(actions.clearSelection());
        DOM.$$('.step.selected').forEach(el => {
            DOM.removeClass(el, 'selected');
        });
    }
    
    copy() {
        const state = this.store.getState();
        const selectedData = this.getSelectedData(state.ui.selectedSteps);
        this.store.dispatch(actions.setClipboard(selectedData));
        this.showToast('Copied to clipboard');
    }
    
    cut() {
        this.copy();
        // Clear selected steps
        DOM.$$('.step.selected').forEach(step => {
            DOM.removeClass(step, 'active', 'selected');
            DOM.setContent(step, '');
        });
        this.clearSelection();
    }
    
    paste() {
        const clipboard = this.store.get('ui.clipboard');
        if (!clipboard || !clipboard.length) {
            this.showToast('Nothing to paste');
            return;
        }
        // Implementation would paste clipboard data
        this.showToast('Pasted');
    }
    
    getSelectedData(selectedSteps) {
        // Get data from selected steps
        return Array.from(selectedSteps).map(stepId => {
            const step = DOM.$(`[data-step-id="${stepId}"]`);
            if (!step) return null;
            return {
                id: stepId,
                content: step.innerHTML,
                active: DOM.hasClass(step, 'active')
            };
        }).filter(Boolean);
    }
    
    /**
     * Open export modal
     */
    openExportModal() {
        const modal = DOM.$('#exportModal');
        if (modal) {
            DOM.show(modal, 'flex');
        }
    }
    
    /**
     * UI feedback
     */
    showToast(message) {
        // Simple toast implementation
        const toast = DOM.createElement('div', {
            className: 'toast',
            style: {
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                background: 'rgba(78, 205, 196, 0.9)',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '8px',
                zIndex: '9999'
            }
        }, [message]);
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            DOM.fadeOut(toast).then(() => {
                document.body.removeChild(toast);
            });
        }, 3000);
    }
    
    showError(message) {
        // Simple error display
        const error = DOM.createElement('div', {
            className: 'error-message',
            style: {
                position: 'fixed',
                top: '20px',
                right: '20px',
                background: 'rgba(255, 71, 87, 0.9)',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '8px',
                zIndex: '9999'
            }
        }, [message]);
        
        document.body.appendChild(error);
        
        setTimeout(() => {
            DOM.fadeOut(error).then(() => {
                document.body.removeChild(error);
            });
        }, 5000);
    }
}

// Create and initialize app when DOM is ready
const app = new TromklubApp();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', app.init);
} else {
    app.init();
}

// Export for debugging
window.TromklubApp = app;

export default app;