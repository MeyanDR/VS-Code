/**
 * Core.js - Core functionality module for TromKlub
 * Contains global state management, data models, undo/redo system, 
 * project save/load functionality, session management, and MIDI handling.
 */

// ==========================================
// CONFIGURATION & CONSTANTS
// ==========================================

export const LAYOUT = {
    grid: {
        // Core dimensions
        stepW: 35,
        beatGap: 2,
        nameCol: 110,
        rowGap: 8,
        
        // System spacing
        systemSpacing: 32,
        
        // Bars per line constraints
        barsPerLineMin: 0, // 0 means unlimited
        barsPerLineMax: 0, // 0 means unlimited
        
        // Line strokes
        strokeThin: 1,
        strokeBeat: 2,
        strokeBar: 3,
        
        // Label positioning
        labelOffsetBeats: 12,
        labelOffsetBars: 6,
        
        // Section spacing (for Full song scope)
        sectionGap: 24,
        
        // Legacy compatibility - will be removed
        pageLeftX: 40,
        pageRightX: 40,
        nameColumnWidth: 110, // maps to nameCol
        nameGap: 10,
        stepSize: 30, // maps to stepW
        rowHeight: 60,
        blockSpacing: 12,
        barHeaderBeatSpacing: 8,
        beatGridSpacing: 12,
        thinLineWidth: 1, // maps to strokeThin
        thickLineWidth: 2, // maps to strokeBeat
        barLineWidth: 3, // maps to strokeBar
        
        // Colors
        thinLineColor: '#dddddd',
        thickLineColor: '#333333',
        stepBackgroundActive: '#f8f9fa',
        stepBackgroundInactive: '#ffffff'
    },
    
    page: {
        size: 'A4',
        orientation: 'portrait',
        width: 1270,  // 794 * 1.6 for better visibility
        height: 1797  // 1123 * 1.6 for better visibility
    },
    
    fonts: {
        title: { family: 'Helvetica', size: 24, weight: 'bold', style: 'normal' },
        subtitle: { family: 'Helvetica', size: 14, weight: 'normal', style: 'normal' },
        instrumentName: { family: 'Helvetica', size: 12, weight: 'bold', style: 'normal' },
        beatLabel: { family: 'Helvetica', size: 10, weight: 'normal', style: 'normal' },
        barNumber: { family: 'Helvetica', size: 10, weight: 'bold', style: 'normal' },
        subdivisionLabel: { family: 'Helvetica', size: 8, weight: 'normal', style: 'normal' },
        legend: { family: 'Helvetica', size: 9, weight: 'normal', style: 'normal' }
    }
};

export const THEMES = {
    'classic-engraved': {
        fonts: {
            title: { family: 'Times New Roman', size: 26, weight: 'bold', style: 'normal' },
            subtitle: { family: 'Georgia', size: 14, weight: 'normal', style: 'normal' },
            instrumentName: { family: 'Times New Roman', size: 12, weight: 'bold', style: 'normal' },
            beatLabel: { family: 'Times New Roman', size: 10, weight: 'normal', style: 'normal' },
            barNumber: { family: 'Times New Roman', size: 10, weight: 'bold', style: 'normal' },
            subdivisionLabel: { family: 'Times New Roman', size: 8, weight: 'normal', style: 'normal' },
            legend: { family: 'Times New Roman', size: 9, weight: 'normal', style: 'normal' }
        },
        grid: { strokeThin: 1, strokeBeat: 2, strokeBar: 2 }
    },
    'modern-sans': {
        fonts: {
            title: { family: 'Helvetica', size: 24, weight: 'bold', style: 'normal' },
            subtitle: { family: 'Arial', size: 14, weight: 'normal', style: 'normal' },
            instrumentName: { family: 'Helvetica', size: 12, weight: 'bold', style: 'normal' },
            beatLabel: { family: 'Helvetica', size: 10, weight: 'normal', style: 'normal' },
            barNumber: { family: 'Helvetica', size: 10, weight: 'bold', style: 'normal' },
            subdivisionLabel: { family: 'Helvetica', size: 8, weight: 'normal', style: 'normal' },
            legend: { family: 'Helvetica', size: 9, weight: 'normal', style: 'normal' }
        },
        grid: { strokeThin: 1, strokeBeat: 2, strokeBar: 3 }
    },
    'jazz-lead': {
        fonts: {
            title: { family: 'Futura', size: 28, weight: 'bold', style: 'italic' },
            subtitle: { family: 'Arial Rounded MT Bold', size: 14, weight: 'normal', style: 'italic' },
            instrumentName: { family: 'Futura', size: 12, weight: 'bold', style: 'normal' },
            beatLabel: { family: 'Futura', size: 10, weight: 'normal', style: 'normal' },
            barNumber: { family: 'Futura', size: 10, weight: 'bold', style: 'normal' },
            subdivisionLabel: { family: 'Futura', size: 8, weight: 'normal', style: 'normal' },
            legend: { family: 'Futura', size: 9, weight: 'normal', style: 'normal' }
        },
        grid: { strokeThin: 1, strokeBeat: 2, strokeBar: 2 }
    }
};

// Maintain backwards compatibility
export const GRID_CONFIG = LAYOUT.grid;

// ==========================================
// GLOBAL STATE MANAGEMENT
// ==========================================

// Main sections data structure
export let sections = {
    'intro': {
        id: 'intro',
        name: 'Intro',
        bars: 4,
        beats: 4,
        subdivisions: 4,
        instruments: [],
        notes: '',
        patternType: 'sequential'
    }
};

// Current state tracking
export let currentSectionId = 'intro';
export let currentSectionIndex = 0;
export let currentEditingInstrument = null;
export let currentEditingStep = null;
export let currentEditingBeat = null;
export let projectName = 'Untitled Project';

// Export state for modal controls
export let exportState = {
    scope: 'section', // 'song' or 'section'
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
};

// Export settings
export let exportSettings = {
    fileName: '',
    author: '',
    copyright: '',
    version: '1.0'
};

// ==========================================
// UNDO/REDO SYSTEM
// ==========================================

export let actionHistory = [];
export let historyIndex = -1;
export const MAX_HISTORY = 50;

/**
 * Save an action to the undo/redo history
 * @param {string} actionType - Type of action performed
 * @param {Object} data - Action data containing before/after states
 */
export function saveAction(actionType, data) {
    const action = {
        type: actionType,
        data: data,
        timestamp: Date.now(),
        sectionId: currentSectionId
    };
    
    // Remove any actions after current index (if we've undone actions)
    if (historyIndex < actionHistory.length - 1) {
        actionHistory = actionHistory.slice(0, historyIndex + 1);
    }
    
    // Add new action
    actionHistory.push(action);
    
    // Limit history size
    if (actionHistory.length > MAX_HISTORY) {
        actionHistory = actionHistory.slice(-MAX_HISTORY);
    }
    
    historyIndex = actionHistory.length - 1;
    
    // Update UI button states if they exist
    updateUndoRedoButtons();
}

/**
 * Update undo/redo button states
 */
export function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    
    if (undoBtn) {
        undoBtn.disabled = historyIndex < 0;
    }
    if (redoBtn) {
        redoBtn.disabled = historyIndex >= actionHistory.length - 1;
    }
}

/**
 * Undo the last action
 */
export function undo() {
    if (historyIndex < 0) return;
    
    const action = actionHistory[historyIndex];
    
    // Restore the 'before' state
    if (action.data && action.data.before) {
        restoreState(action.data.before);
        historyIndex--;
        updateUndoRedoButtons();
        
        // Trigger re-render if render function is available
        if (typeof window.renderSequencer === 'function') {
            window.renderSequencer();
        }
    }
}

/**
 * Redo the next action
 */
export function redo() {
    if (historyIndex >= actionHistory.length - 1) return;
    
    historyIndex++;
    const action = actionHistory[historyIndex];
    
    // Apply the 'after' state
    if (action.data && action.data.after) {
        restoreState(action.data.after);
        updateUndoRedoButtons();
        
        // Trigger re-render if render function is available
        if (typeof window.renderSequencer === 'function') {
            window.renderSequencer();
        }
    }
}

/**
 * Restore application state from saved data
 * @param {Object} state - State data to restore
 */
function restoreState(state) {
    if (state.sections) {
        sections = { ...state.sections };
    }
    if (state.currentSectionId !== undefined) {
        currentSectionId = state.currentSectionId;
    }
    if (state.projectName !== undefined) {
        projectName = state.projectName;
    }
}

// ==========================================
// SECTION MANAGEMENT
// ==========================================

/**
 * Get current active section
 * @returns {Object} Current section object
 */
export function getCurrentSection() {
    return sections[currentSectionId] || sections['intro'];
}

/**
 * Get sections as array in order
 * @returns {Array} Array of section objects
 */
export function getSectionsAsArray() {
    return Object.values(sections);
}

/**
 * Set current section by ID
 * @param {string} sectionId - ID of section to make current
 */
export function setCurrentSection(sectionId) {
    if (sections[sectionId]) {
        currentSectionId = sectionId;
        const sectionsArray = getSectionsAsArray();
        currentSectionIndex = sectionsArray.findIndex(s => s.id === sectionId);
    }
}

/**
 * Add a new section
 * @param {Object} sectionData - Section data to add
 * @returns {string} ID of the created section
 */
export function addSection(sectionData) {
    const id = sectionData.id || generateUniqueId('section');
    sections[id] = {
        id,
        name: sectionData.name || 'New Section',
        bars: sectionData.bars || 4,
        beats: sectionData.beats || 4,
        subdivisions: sectionData.subdivisions || 4,
        instruments: sectionData.instruments || [],
        notes: sectionData.notes || '',
        patternType: sectionData.patternType || 'sequential',
        ...sectionData
    };
    return id;
}

/**
 * Remove a section by ID
 * @param {string} sectionId - ID of section to remove
 * @returns {boolean} True if section was removed
 */
export function removeSection(sectionId) {
    if (sections[sectionId] && Object.keys(sections).length > 1) {
        delete sections[sectionId];
        
        // If we deleted the current section, switch to first available
        if (currentSectionId === sectionId) {
            const remaining = Object.keys(sections);
            setCurrentSection(remaining[0]);
        }
        return true;
    }
    return false;
}

/**
 * Generate a unique ID
 * @param {string} prefix - Prefix for the ID
 * @returns {string} Unique ID
 */
function generateUniqueId(prefix = 'item') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ==========================================
// PROJECT SAVE/LOAD FUNCTIONALITY
// ==========================================

/**
 * Save current project as JSON
 * @returns {string} JSON string of project data
 */
export function saveProject() {
    const projectData = {
        version: '2.0',
        name: projectName,
        sections: sections,
        currentSectionId: currentSectionId,
        exportSettings: exportSettings,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    const json = JSON.stringify(projectData, null, 2);
    
    // Create download
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName || 'tromklub-project'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    return json;
}

/**
 * Load project from JSON data
 * @param {Object} projectData - Project data to load
 */
export function loadProject(projectData) {
    try {
        if (projectData.sections) {
            sections = { ...projectData.sections };
        }
        
        if (projectData.name) {
            projectName = projectData.name;
        }
        
        if (projectData.currentSectionId && sections[projectData.currentSectionId]) {
            setCurrentSection(projectData.currentSectionId);
        }
        
        if (projectData.exportSettings) {
            exportSettings = { ...exportSettings, ...projectData.exportSettings };
        }
        
        // Clear history after loading
        actionHistory = [];
        historyIndex = -1;
        updateUndoRedoButtons();
        
        return true;
    } catch (error) {
        console.error('Error loading project:', error);
        return false;
    }
}

// ==========================================
// SESSION MANAGEMENT
// ==========================================

/**
 * Save current state as a session to localStorage
 * @param {string} sessionName - Name for the session
 */
export function saveSession(sessionName) {
    try {
        const sessionData = {
            name: sessionName,
            sections: sections,
            currentSectionId: currentSectionId,
            projectName: projectName,
            exportSettings: exportSettings,
            timestamp: Date.now(),
            date: new Date().toLocaleString()
        };
        
        const sessions = getAllSavedSessions();
        const sessionId = 'session_' + Date.now();
        sessions[sessionId] = sessionData;
        
        localStorage.setItem('tromklub_sessions', JSON.stringify(sessions));
        return sessionId;
    } catch (error) {
        console.error('Error saving session:', error);
        throw error;
    }
}

/**
 * Load a specific session by ID
 * @param {string} sessionId - ID of session to load
 */
export function loadSession(sessionId) {
    try {
        const sessions = getAllSavedSessions();
        const sessionData = sessions[sessionId];
        
        if (!sessionData) {
            throw new Error('Session not found');
        }
        
        // Load the session data
        if (sessionData.sections) {
            sections = { ...sessionData.sections };
        }
        if (sessionData.currentSectionId) {
            setCurrentSection(sessionData.currentSectionId);
        }
        if (sessionData.projectName) {
            projectName = sessionData.projectName;
        }
        if (sessionData.exportSettings) {
            exportSettings = { ...exportSettings, ...sessionData.exportSettings };
        }
        
        // Clear history after loading
        actionHistory = [];
        historyIndex = -1;
        updateUndoRedoButtons();
        
        return true;
    } catch (error) {
        console.error('Error loading session:', error);
        throw error;
    }
}

/**
 * Get all saved sessions from localStorage
 * @returns {Object} Object containing all saved sessions
 */
export function getAllSavedSessions() {
    try {
        const sessionsData = localStorage.getItem('tromklub_sessions');
        if (!sessionsData) {
            // Check for legacy session format
            const oldSession = localStorage.getItem('tromklub_session');
            if (oldSession) {
                const parsedOld = JSON.parse(oldSession);
                return {
                    'legacy_session': {
                        name: 'Legacy Session',
                        ...parsedOld,
                        timestamp: 0
                    }
                };
            }
            return {};
        }
        return JSON.parse(sessionsData);
    } catch (error) {
        console.error('Error loading sessions:', error);
        return {};
    }
}

/**
 * Delete a saved session
 * @param {string} sessionId - ID of session to delete
 */
export function deleteSession(sessionId) {
    try {
        const sessions = getAllSavedSessions();
        delete sessions[sessionId];
        localStorage.setItem('tromklub_sessions', JSON.stringify(sessions));
        return true;
    } catch (error) {
        console.error('Error deleting session:', error);
        return false;
    }
}

// ==========================================
// MIDI FILE HANDLING
// ==========================================

export let currentMidiData = null;
export let midiNoteMapping = {};

/**
 * Parse a MIDI file from ArrayBuffer
 * @param {ArrayBuffer} arrayBuffer - MIDI file data
 * @returns {Object} Parsed MIDI data
 */
export function parseMidiFile(arrayBuffer) {
    try {
        // Validate MIDI header
        const headerChunk = String.fromCharCode(...new Uint8Array(arrayBuffer, 0, 4));
        if (headerChunk !== 'MThd') {
            throw new Error('Invalid MIDI file: Missing MThd header');
        }
        
        const dataView = new DataView(arrayBuffer);
        
        // Read header length (should be 6)
        const headerLength = dataView.getUint32(4);
        if (headerLength !== 6) {
            throw new Error('Invalid MIDI header length');
        }
        
        // Read MIDI format, number of tracks, and timing division
        const format = dataView.getUint16(8);
        const numTracks = dataView.getUint16(10);
        const ticksPerQuarter = dataView.getUint16(12);
        
        console.log(`MIDI Info: Format ${format}, ${numTracks} tracks, ${ticksPerQuarter} ticks per quarter`);
        
        if (format > 2) {
            throw new Error(`Unsupported MIDI format: ${format}`);
        }
        
        const tracks = [];
        let offset = 14; // Start after header
        
        // Parse each track
        for (let trackNum = 0; trackNum < numTracks; trackNum++) {
            const track = parseMidiTrack(dataView, offset, trackNum);
            if (track) {
                tracks.push(track);
                offset = track.nextOffset;
            }
        }
        
        return {
            format,
            numTracks,
            ticksPerQuarter,
            tracks: tracks.filter(track => track.notes && track.notes.length > 0)
        };
        
    } catch (error) {
        console.error('MIDI Parse Error:', error);
        throw new Error(`MIDI parsing failed: ${error.message}`);
    }
}

/**
 * Parse a single MIDI track
 * @param {DataView} dataView - MIDI file data view
 * @param {number} offset - Current offset in the file
 * @param {number} trackNumber - Track number (0-indexed)
 * @returns {Object} Parsed track data
 */
function parseMidiTrack(dataView, offset, trackNumber) {
    try {
        // Check track header
        const trackHeader = String.fromCharCode(
            dataView.getUint8(offset),
            dataView.getUint8(offset + 1),
            dataView.getUint8(offset + 2),
            dataView.getUint8(offset + 3)
        );
        
        if (trackHeader !== 'MTrk') {
            console.warn(`Track ${trackNumber}: Invalid track header`);
            return null;
        }
        
        const trackLength = dataView.getUint32(offset + 4);
        const trackStart = offset + 8;
        const trackEnd = trackStart + trackLength;
        
        let currentOffset = trackStart;
        let currentTime = 0;
        let runningStatus = 0;
        const notes = [];
        const noteOnEvents = new Map(); // Track note-on events for note-off matching
        
        while (currentOffset < trackEnd) {
            // Read variable-length delta time
            const deltaTime = readVariableLength(dataView, currentOffset);
            currentTime += deltaTime.value;
            currentOffset = deltaTime.nextOffset;
            
            if (currentOffset >= trackEnd) break;
            
            // Read status byte
            let statusByte = dataView.getUint8(currentOffset);
            let actualStatus = statusByte;
            
            // Handle running status
            if (statusByte < 0x80) {
                actualStatus = runningStatus;
                currentOffset--; // Don't consume the data byte
            } else {
                runningStatus = statusByte;
            }
            currentOffset++;
            
            const messageType = actualStatus & 0xF0;
            const channel = actualStatus & 0x0F;
            
            // Process MIDI events
            if (messageType === 0x90 || messageType === 0x80) { // Note On/Off
                if (currentOffset + 1 >= trackEnd) break;
                
                const note = dataView.getUint8(currentOffset);
                const velocity = dataView.getUint8(currentOffset + 1);
                currentOffset += 2;
                
                // Treat Note On with velocity 0 as Note Off
                const isNoteOn = (messageType === 0x90 && velocity > 0);
                
                if (isNoteOn) {
                    // Store note-on event
                    const noteKey = `${channel}_${note}`;
                    noteOnEvents.set(noteKey, {
                        time: currentTime,
                        note: note,
                        velocity: velocity,
                        channel: channel
                    });
                } else {
                    // Note off - find matching note-on
                    const noteKey = `${channel}_${note}`;
                    const noteOnEvent = noteOnEvents.get(noteKey);
                    if (noteOnEvent) {
                        notes.push({
                            time: noteOnEvent.time,
                            note: note,
                            velocity: noteOnEvent.velocity,
                            duration: currentTime - noteOnEvent.time,
                            channel: channel,
                            name: midiNoteToName(note),
                            track: trackNumber
                        });
                        noteOnEvents.delete(noteKey);
                    }
                }
            } else if (messageType === 0xB0) { // Control Change
                currentOffset += 2; // Skip controller and value
            } else if (messageType === 0xC0) { // Program Change
                currentOffset += 1; // Skip program number
            } else if (messageType === 0xD0) { // Channel Pressure
                currentOffset += 1; // Skip pressure value
            } else if (messageType === 0xE0) { // Pitch Bend
                currentOffset += 2; // Skip pitch bend value
            } else if (statusByte === 0xFF) { // Meta Event
                if (currentOffset >= trackEnd) break;
                const metaType = dataView.getUint8(currentOffset++);
                const length = readVariableLength(dataView, currentOffset);
                currentOffset = length.nextOffset + length.value; // Skip meta data
            } else if (statusByte === 0xF0) { // System Exclusive
                const length = readVariableLength(dataView, currentOffset);
                currentOffset = length.nextOffset + length.value; // Skip sysex data
            } else {
                // Unknown event type - try to skip
                console.warn(`Unknown MIDI event: 0x${statusByte.toString(16)} at offset ${currentOffset}`);
                currentOffset++;
            }
        }
        
        return {
            trackNumber,
            notes,
            nextOffset: trackEnd
        };
        
    } catch (error) {
        console.error(`Error parsing track ${trackNumber}:`, error);
        return { trackNumber, notes: [], nextOffset: offset + 8 };
    }
}

/**
 * Read variable-length quantity from MIDI data
 * @param {DataView} dataView - MIDI data view
 * @param {number} offset - Current offset
 * @returns {Object} {value, nextOffset}
 */
function readVariableLength(dataView, offset) {
    let value = 0;
    let currentOffset = offset;
    
    for (let i = 0; i < 4; i++) { // Max 4 bytes
        if (currentOffset >= dataView.byteLength) {
            throw new Error('Unexpected end of file while reading variable length');
        }
        
        const byte = dataView.getUint8(currentOffset++);
        value = (value << 7) | (byte & 0x7F);
        
        if (!(byte & 0x80)) { // If bit 7 is not set, we're done
            break;
        }
    }
    
    return { value, nextOffset: currentOffset };
}

/**
 * Convert MIDI note number to note name
 * @param {number} noteNumber - MIDI note number (0-127)
 * @returns {string} Note name (e.g., "C4", "F#5")
 */
export function midiNoteToName(noteNumber) {
    if (noteNumber < 0 || noteNumber > 127) {
        return `Note${noteNumber}`;
    }
    
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(noteNumber / 12) - 1;
    const note = noteNames[noteNumber % 12];
    return `${note}${octave}`;
}

/**
 * Set MIDI note mapping for import
 * @param {number} noteNumber - MIDI note number
 * @param {string} symbol - Drum symbol to map to
 */
export function setMidiNoteMapping(noteNumber, symbol) {
    midiNoteMapping[noteNumber] = symbol;
}

/**
 * Clear current MIDI data and mappings
 */
export function clearMidiData() {
    currentMidiData = null;
    midiNoteMapping = {};
}

// ==========================================
// LAYOUT MANAGEMENT
// ==========================================

/**
 * Initialize layout with default values
 */
export function initializeLayoutDefaults() {
    // Set default page size
    updatePageSize('A4', 'portrait');
    
    // Apply Modern Sans theme as default
    const modernTheme = THEMES['modern-sans'];
    Object.assign(LAYOUT.fonts, modernTheme.fonts);
    Object.assign(LAYOUT.grid, modernTheme.grid);
}

/**
 * Calculate page dimensions for different sizes and orientations
 * @param {string} size - Page size ('A4', 'A3', 'Letter')
 * @param {string} orientation - Page orientation ('portrait' or 'landscape')
 * @returns {Object} {width, height}
 */
export function calculatePageDimensions(size, orientation) {
    const sizes = {
        'A4': { width: 1270, height: 1797 },  // 794*1.6, 1123*1.6
        'A3': { width: 1797, height: 2539 },  // scaled up proportionally
        'Letter': { width: 1306, height: 1690 }  // scaled up proportionally
    };
    
    let dims = sizes[size] || sizes['A4'];
    if (orientation === 'landscape') {
        return { width: dims.height, height: dims.width };
    }
    return dims;
}

/**
 * Update page size and orientation
 * @param {string} size - Page size
 * @param {string} orientation - Page orientation
 */
export function updatePageSize(size, orientation) {
    const dims = calculatePageDimensions(size, orientation);
    LAYOUT.page.size = size;
    LAYOUT.page.orientation = orientation;
    LAYOUT.page.width = dims.width;
    LAYOUT.page.height = dims.height;
}

/**
 * Apply theme to layout
 * @param {string} themeName - Name of theme to apply
 */
export function applyTheme(themeName) {
    const theme = THEMES[themeName];
    if (theme) {
        Object.assign(LAYOUT.fonts, theme.fonts);
        Object.assign(LAYOUT.grid, theme.grid);
    }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Create a deep clone of an object
 * @param {any} obj - Object to clone
 * @returns {any} Deep copy of the object
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    
    if (obj instanceof Array) {
        return obj.map(item => deepClone(item));
    }
    
    if (typeof obj === 'object') {
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = deepClone(obj[key]);
            }
        }
        return cloned;
    }
    
    return obj;
}

/**
 * Show error message to user
 * @param {string} title - Error title
 * @param {string} message - Error message
 */
export function showError(title, message) {
    console.error(`${title}: ${message}`);
    
    // Try to show toast notification if available
    if (typeof window.showToast === 'function') {
        window.showToast(title);
    } else {
        alert(`${title}\n\n${message}`);
    }
}

// ==========================================
// INITIALIZATION
// ==========================================

/**
 * Initialize the core module
 */
export function initializeCore() {
    console.log('🎯 Core module initializing...');
    
    // Initialize layout defaults
    initializeLayoutDefaults();
    
    // Update undo/redo buttons
    updateUndoRedoButtons();
    
    console.log('✅ Core module initialized');
}

// Auto-initialize if running in browser
if (typeof window !== 'undefined') {
    // Make functions available globally for compatibility
    window.undo = undo;
    window.redo = redo;
    window.saveProject = saveProject;
    window.loadProject = loadProject;
    window.saveSession = saveSession;
    window.loadSession = loadSession;
    window.parseMidiFile = parseMidiFile;
    window.midiNoteToName = midiNoteToName;
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeCore);
    } else {
        initializeCore();
    }
}