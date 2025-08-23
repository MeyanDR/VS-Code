/**
 * State Management Store
 * Centralized state management using a functional approach
 */

import { LAYOUT } from '../config/layout.js';
import { THEMES } from '../config/themes.js';

// Initial state definition
const initialState = {
    // Project data
    project: {
        title: 'New Composition',
        composer: '',
        sections: [],
        currentSectionIndex: 0,
        customTheme: null,
        legend: {}
    },
    
    // UI state
    ui: {
        activeSymbol: 'X',
        activeModifier: '',
        selectedSteps: new Set(),
        selectionAnchor: null,
        isShiftSelecting: false,
        isDragging: false,
        dragMode: null, // 'add' | 'delete' | null
        clipboard: []
    },
    
    // Export settings
    exportState: {
        scope: 'section', // 'song' | 'section'
        sectionId: null,
        show: {
            barNumbers: true,
            beatNumbers: true,
            subdivisionNumbers: false,
            legend: true
        },
        locked: false,
        selectedBeat: { barIndex: 0, beatIndex: 0 },
        visibleBreaks: [],
        uiPanels: {
            scope: true,
            theme: false,
            layout: false,
            page: false,
            guides: false,
            apply: false,
            breaks: false,
            shortcuts: false
        }
    },
    
    // Playback state
    playback: {
        isPlaying: false,
        currentBar: 0,
        currentBeat: 0,
        currentStep: 0,
        bpm: 120,
        loop: false
    },
    
    // History for undo/redo
    history: {
        past: [],
        future: [],
        maxHistorySize: 50
    },
    
    // Layout configuration (reference to imported LAYOUT)
    layout: LAYOUT,
    
    // Available themes (reference to imported THEMES)
    themes: THEMES
};

// Create a deep copy of an object
const deepCopy = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Set) return new Set([...obj]);
    if (obj instanceof Map) return new Map([...obj]);
    if (Array.isArray(obj)) return obj.map(item => deepCopy(item));
    
    const cloned = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            cloned[key] = deepCopy(obj[key]);
        }
    }
    return cloned;
};

// Store class using functional patterns
class Store {
    constructor() {
        this.state = deepCopy(initialState);
        this.listeners = new Set();
        this.middlewares = [];
    }
    
    /**
     * Get current state (immutable)
     */
    getState() {
        return deepCopy(this.state);
    }
    
    /**
     * Get specific state path
     */
    get(path) {
        const keys = path.split('.');
        let value = this.state;
        
        for (const key of keys) {
            if (value && typeof value === 'object') {
                value = value[key];
            } else {
                return undefined;
            }
        }
        
        return deepCopy(value);
    }
    
    /**
     * Dispatch an action to update state
     */
    dispatch(action) {
        // Run middlewares
        for (const middleware of this.middlewares) {
            action = middleware(action, this.getState());
            if (!action) return; // Middleware can cancel action
        }
        
        // Save current state to history (if not a history action)
        if (action.type !== 'UNDO' && action.type !== 'REDO' && action.type !== 'CLEAR_HISTORY') {
            this.saveToHistory();
        }
        
        // Apply action
        const newState = this.reducer(this.state, action);
        
        // Only update if state changed
        if (newState !== this.state) {
            this.state = newState;
            this.notifyListeners(action);
        }
    }
    
    /**
     * Main reducer function
     */
    reducer(state, action) {
        switch (action.type) {
            // Project actions
            case 'SET_PROJECT':
                return { ...state, project: action.payload };
                
            case 'UPDATE_PROJECT':
                return { 
                    ...state, 
                    project: { ...state.project, ...action.payload }
                };
                
            case 'ADD_SECTION':
                return {
                    ...state,
                    project: {
                        ...state.project,
                        sections: [...state.project.sections, action.payload]
                    }
                };
                
            case 'UPDATE_SECTION':
                const sections = [...state.project.sections];
                sections[action.index] = { ...sections[action.index], ...action.payload };
                return {
                    ...state,
                    project: { ...state.project, sections }
                };
                
            case 'DELETE_SECTION':
                return {
                    ...state,
                    project: {
                        ...state.project,
                        sections: state.project.sections.filter((_, i) => i !== action.index)
                    }
                };
                
            case 'SET_CURRENT_SECTION':
                return {
                    ...state,
                    project: {
                        ...state.project,
                        currentSectionIndex: action.index
                    }
                };
                
            // UI actions
            case 'SET_ACTIVE_SYMBOL':
                return {
                    ...state,
                    ui: { ...state.ui, activeSymbol: action.payload }
                };
                
            case 'SET_ACTIVE_MODIFIER':
                return {
                    ...state,
                    ui: { ...state.ui, activeModifier: action.payload }
                };
                
            case 'SET_SELECTION':
                return {
                    ...state,
                    ui: { ...state.ui, selectedSteps: new Set(action.payload) }
                };
                
            case 'ADD_TO_SELECTION':
                const newSelection = new Set(state.ui.selectedSteps);
                action.payload.forEach(step => newSelection.add(step));
                return {
                    ...state,
                    ui: { ...state.ui, selectedSteps: newSelection }
                };
                
            case 'REMOVE_FROM_SELECTION':
                const updatedSelection = new Set(state.ui.selectedSteps);
                action.payload.forEach(step => updatedSelection.delete(step));
                return {
                    ...state,
                    ui: { ...state.ui, selectedSteps: updatedSelection }
                };
                
            case 'CLEAR_SELECTION':
                return {
                    ...state,
                    ui: { ...state.ui, selectedSteps: new Set(), selectionAnchor: null }
                };
                
            case 'SET_CLIPBOARD':
                return {
                    ...state,
                    ui: { ...state.ui, clipboard: action.payload }
                };
                
            // Export state actions
            case 'UPDATE_EXPORT_STATE':
                return {
                    ...state,
                    exportState: { ...state.exportState, ...action.payload }
                };
                
            case 'TOGGLE_EXPORT_PANEL':
                return {
                    ...state,
                    exportState: {
                        ...state.exportState,
                        uiPanels: {
                            ...state.exportState.uiPanels,
                            [action.panel]: !state.exportState.uiPanels[action.panel]
                        }
                    }
                };
                
            // Playback actions
            case 'SET_PLAYBACK':
                return {
                    ...state,
                    playback: { ...state.playback, ...action.payload }
                };
                
            case 'TOGGLE_PLAYBACK':
                return {
                    ...state,
                    playback: {
                        ...state.playback,
                        isPlaying: !state.playback.isPlaying
                    }
                };
                
            // Layout actions
            case 'UPDATE_LAYOUT':
                return {
                    ...state,
                    layout: { ...state.layout, ...action.payload }
                };
                
            case 'APPLY_THEME':
                const theme = state.themes[action.themeName];
                if (!theme) return state;
                
                return {
                    ...state,
                    layout: {
                        ...state.layout,
                        fonts: { ...theme.fonts },
                        grid: { ...state.layout.grid, ...theme.grid }
                    }
                };
                
            // History actions
            case 'UNDO':
                if (state.history.past.length === 0) return state;
                
                const previousState = state.history.past[state.history.past.length - 1];
                return {
                    ...previousState,
                    history: {
                        past: state.history.past.slice(0, -1),
                        future: [state, ...state.history.future].slice(0, state.history.maxHistorySize)
                    }
                };
                
            case 'REDO':
                if (state.history.future.length === 0) return state;
                
                const nextState = state.history.future[0];
                return {
                    ...nextState,
                    history: {
                        past: [...state.history.past, state].slice(-state.history.maxHistorySize),
                        future: state.history.future.slice(1)
                    }
                };
                
            case 'CLEAR_HISTORY':
                return {
                    ...state,
                    history: {
                        past: [],
                        future: [],
                        maxHistorySize: state.history.maxHistorySize
                    }
                };
                
            default:
                return state;
        }
    }
    
    /**
     * Save current state to history
     */
    saveToHistory() {
        const stateCopy = deepCopy(this.state);
        // Don't save history in the history
        delete stateCopy.history;
        
        this.state.history.past.push(stateCopy);
        
        // Limit history size
        if (this.state.history.past.length > this.state.history.maxHistorySize) {
            this.state.history.past.shift();
        }
        
        // Clear future when new action is performed
        this.state.history.future = [];
    }
    
    /**
     * Subscribe to state changes
     */
    subscribe(listener) {
        this.listeners.add(listener);
        
        // Return unsubscribe function
        return () => {
            this.listeners.delete(listener);
        };
    }
    
    /**
     * Notify all listeners of state change
     */
    notifyListeners(action) {
        this.listeners.forEach(listener => {
            try {
                listener(this.getState(), action);
            } catch (error) {
                console.error('Error in state listener:', error);
            }
        });
    }
    
    /**
     * Add middleware
     */
    use(middleware) {
        this.middlewares.push(middleware);
    }
    
    /**
     * Reset to initial state
     */
    reset() {
        this.state = deepCopy(initialState);
        this.notifyListeners({ type: 'RESET' });
    }
}

// Create singleton instance
const store = new Store();

// Export store instance and helper functions
export default store;

// Action creators for convenience
export const actions = {
    // Project actions
    setProject: (project) => ({ type: 'SET_PROJECT', payload: project }),
    updateProject: (updates) => ({ type: 'UPDATE_PROJECT', payload: updates }),
    addSection: (section) => ({ type: 'ADD_SECTION', payload: section }),
    updateSection: (index, updates) => ({ type: 'UPDATE_SECTION', index, payload: updates }),
    deleteSection: (index) => ({ type: 'DELETE_SECTION', index }),
    setCurrentSection: (index) => ({ type: 'SET_CURRENT_SECTION', index }),
    
    // UI actions
    setActiveSymbol: (symbol) => ({ type: 'SET_ACTIVE_SYMBOL', payload: symbol }),
    setActiveModifier: (modifier) => ({ type: 'SET_ACTIVE_MODIFIER', payload: modifier }),
    setSelection: (steps) => ({ type: 'SET_SELECTION', payload: steps }),
    addToSelection: (steps) => ({ type: 'ADD_TO_SELECTION', payload: steps }),
    removeFromSelection: (steps) => ({ type: 'REMOVE_FROM_SELECTION', payload: steps }),
    clearSelection: () => ({ type: 'CLEAR_SELECTION' }),
    setClipboard: (data) => ({ type: 'SET_CLIPBOARD', payload: data }),
    
    // Export actions
    updateExportState: (updates) => ({ type: 'UPDATE_EXPORT_STATE', payload: updates }),
    toggleExportPanel: (panel) => ({ type: 'TOGGLE_EXPORT_PANEL', panel }),
    
    // Playback actions
    setPlayback: (updates) => ({ type: 'SET_PLAYBACK', payload: updates }),
    togglePlayback: () => ({ type: 'TOGGLE_PLAYBACK' }),
    
    // Layout actions
    updateLayout: (updates) => ({ type: 'UPDATE_LAYOUT', payload: updates }),
    applyTheme: (themeName) => ({ type: 'APPLY_THEME', themeName }),
    
    // History actions
    undo: () => ({ type: 'UNDO' }),
    redo: () => ({ type: 'REDO' }),
    clearHistory: () => ({ type: 'CLEAR_HISTORY' })
};