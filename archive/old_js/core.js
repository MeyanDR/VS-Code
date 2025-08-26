/* ========================================== */
/*               TROMKLUB CORE MODULE         */
/*         State Management & Core Functions  */
/* ========================================== */

// ==========================================
//           CONFIGURATION & CONSTANTS
// ==========================================

export const LAYOUT = {
    page: {
        width: 794,
        height: 1123,
        margin: 50
    },
    grid: {
        pageLeftX: 80,
        nameCol: 120,
        stepW: 25,
        beatGap: 15,
        systemSpacing: 40,
        labelOffsetBeats: 20,
        labelOffsetBars: 30,
        barsPerLineMax: 8,
        barsPerLineMin: 2
    },
    fonts: {
        title: { family: 'Arial', size: 16, weight: 'bold', style: 'normal' },
        sectionTitle: { family: 'Arial', size: 14, weight: 'bold', style: 'normal' },
        instrumentName: { family: 'Arial', size: 12, weight: 'normal', style: 'normal' },
        stepContent: { family: 'Arial', size: 11, weight: 'bold', style: 'normal' },
        beatLabel: { family: 'Arial', size: 10, weight: 'normal', style: 'normal' },
        barLabel: { family: 'Arial', size: 9, weight: 'normal', style: 'italic' }
    }
};

export const THEMES = {
    'classic-engraved': {
        name: 'Classic Engraved',
        fonts: {
            title: { family: 'Times', size: 18, weight: 'bold', style: 'normal' },
            sectionTitle: { family: 'Times', size: 16, weight: 'bold', style: 'normal' },
            instrumentName: { family: 'Times', size: 14, weight: 'normal', style: 'normal' },
            stepContent: { family: 'Times', size: 12, weight: 'bold', style: 'normal' },
            beatLabel: { family: 'Times', size: 11, weight: 'normal', style: 'normal' },
            barLabel: { family: 'Times', size: 10, weight: 'normal', style: 'italic' }
        }
    },
    'modern-sans': {
        name: 'Modern Sans',
        fonts: {
            title: { family: 'Helvetica', size: 16, weight: 'bold', style: 'normal' },
            sectionTitle: { family: 'Helvetica', size: 14, weight: 'bold', style: 'normal' },
            instrumentName: { family: 'Helvetica', size: 12, weight: 'normal', style: 'normal' },
            stepContent: { family: 'Helvetica', size: 11, weight: 'bold', style: 'normal' },
            beatLabel: { family: 'Helvetica', size: 10, weight: 'normal', style: 'normal' },
            barLabel: { family: 'Helvetica', size: 9, weight: 'normal', style: 'italic' }
        }
    },
    'jazz-lead': {
        name: 'Jazz Lead Sheet',
        fonts: {
            title: { family: 'Times', size: 20, weight: 'bold', style: 'normal' },
            sectionTitle: { family: 'Times', size: 18, weight: 'bold', style: 'normal' },
            instrumentName: { family: 'Times', size: 14, weight: 'normal', style: 'italic' },
            stepContent: { family: 'Times', size: 13, weight: 'bold', style: 'normal' },
            beatLabel: { family: 'Times', size: 12, weight: 'normal', style: 'normal' },
            barLabel: { family: 'Times', size: 11, weight: 'normal', style: 'italic' }
        }
    }
};

export const GRID_CONFIG = LAYOUT.grid;

// ==========================================
//              GLOBAL STATE
// ==========================================

export let sections = {
    intro: {
        name: "Intro",
        bars: 4,
        beats: 4,
        subdivision: 4,
        instruments: [
            { id: 1, name: "Kick", steps: {} },
            { id: 2, name: "Snare", steps: {} },
            { id: 3, name: "HiHat", steps: {} }
        ],
        notes: ""
    }
};

export let currentSectionId = 'intro';
export let currentSectionIndex = 0;
export let projectName = 'Untitled Project';
export let nextId = 4;

// Action History for Undo/Redo
export let actionHistory = [];
export let historyIndex = -1;

// Export State
export const exportState = {
    scope: 'section',
    show: {
        instrumentNames: true,
        barNumbers: true,
        beatNumbers: true
    },
    theme: 'classic-engraved',
    fontSize: 12,
    pageSize: 'A4',
    orientation: 'portrait',
    margins: {
        top: 50,
        left: 50,
        right: 50,
        bottom: 50
    }
};

export const exportSettings = {
    selectedSection: null,
    selectedInstruments: new Set(),
    selectedBars: new Set()
};

// ==========================================
//              UTILITY FUNCTIONS
// ==========================================

export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(deepClone);
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

export function generateUniqueId() {
    return nextId++;
}

export function safeStringify(obj, indent = 2) {
    try {
        return JSON.stringify(obj, null, indent);
    } catch (error) {
        console.error('Failed to stringify object:', error);
        return '{}';
    }
}

export function safeParse(jsonString, defaultValue = {}) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Failed to parse JSON:', error);
        return defaultValue;
    }
}

// ==========================================
//         SECTION MANAGEMENT
// ==========================================

export function getCurrentSection() {
    return sections[currentSectionId] || sections['intro'];
}

export function getSectionsAsArray() {
    return Object.keys(sections).map((key, index) => ({
        id: key,
        index,
        ...sections[key]
    }));
}

export function setCurrentSection(sectionId) {
    if (sections[sectionId]) {
        currentSectionId = sectionId;
        const sectionsArray = getSectionsAsArray();
        currentSectionIndex = sectionsArray.findIndex(s => s.id === sectionId);
    }
}

export function addSection(name, config = {}) {
    const id = name.toLowerCase().replace(/\s+/g, '_');
    const section = {
        name: name,
        bars: config.bars || 4,
        beats: config.beats || 4,
        subdivision: config.subdivision || 4,
        instruments: config.instruments || [
            { id: generateUniqueId(), name: "Kick", steps: {} },
            { id: generateUniqueId(), name: "Snare", steps: {} },
            { id: generateUniqueId(), name: "HiHat", steps: {} }
        ],
        notes: config.notes || ""
    };
    
    sections[id] = section;
    return id;
}

export function removeSection(sectionId) {
    if (Object.keys(sections).length <= 1) return false;
    
    delete sections[sectionId];
    
    if (currentSectionId === sectionId) {
        const remainingIds = Object.keys(sections);
        setCurrentSection(remainingIds[0]);
    }
    
    return true;
}

// ==========================================
//           UNDO/REDO SYSTEM
// ==========================================

export function saveAction(actionType, data) {
    try {
        const action = {
            type: actionType,
            timestamp: Date.now(),
            data: deepClone(data)
        };
        
        // Remove any actions after current index
        actionHistory = actionHistory.slice(0, historyIndex + 1);
        
        // Add new action
        actionHistory.push(action);
        historyIndex++;
        
        // Limit history size
        const maxHistory = 50;
        if (actionHistory.length > maxHistory) {
            const removeCount = actionHistory.length - maxHistory;
            actionHistory.splice(0, removeCount);
            historyIndex -= removeCount;
        }
        
        updateUndoRedoButtons();
    } catch (error) {
        console.error('Error saving action:', error);
    }
}

export function undo() {
    if (historyIndex < 0) return false;
    
    try {
        const action = actionHistory[historyIndex];
        
        switch (action.type) {
            case 'step_change':
                if (action.data.before) {
                    const section = sections[action.data.sectionId];
                    if (section) {
                        const instrument = section.instruments.find(i => i.id === action.data.instrumentId);
                        if (instrument) {
                            instrument.steps = deepClone(action.data.before.steps);
                        }
                    }
                }
                break;
                
            case 'section_change':
                if (action.data.before) {
                    sections[action.data.sectionId] = deepClone(action.data.before);
                }
                break;
                
            case 'project_change':
                if (action.data.before) {
                    sections = deepClone(action.data.before.sections);
                    projectName = action.data.before.projectName || projectName;
                }
                break;
        }
        
        historyIndex--;
        updateUndoRedoButtons();
        
        // Trigger UI update if function exists
        if (typeof updateGrid === 'function') {
            updateGrid();
        }
        
        return true;
    } catch (error) {
        console.error('Error during undo:', error);
        return false;
    }
}

export function redo() {
    if (historyIndex >= actionHistory.length - 1) return false;
    
    try {
        historyIndex++;
        const action = actionHistory[historyIndex];
        
        switch (action.type) {
            case 'step_change':
                if (action.data.after) {
                    const section = sections[action.data.sectionId];
                    if (section) {
                        const instrument = section.instruments.find(i => i.id === action.data.instrumentId);
                        if (instrument) {
                            instrument.steps = deepClone(action.data.after.steps);
                        }
                    }
                }
                break;
                
            case 'section_change':
                if (action.data.after) {
                    sections[action.data.sectionId] = deepClone(action.data.after);
                }
                break;
                
            case 'project_change':
                if (action.data.after) {
                    sections = deepClone(action.data.after.sections);
                    projectName = action.data.after.projectName || projectName;
                }
                break;
        }
        
        updateUndoRedoButtons();
        
        // Trigger UI update if function exists
        if (typeof updateGrid === 'function') {
            updateGrid();
        }
        
        return true;
    } catch (error) {
        console.error('Error during redo:', error);
        return false;
    }
}

export function updateUndoRedoButtons() {
    if (typeof document !== 'undefined') {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        if (undoBtn) undoBtn.disabled = historyIndex < 0;
        if (redoBtn) redoBtn.disabled = historyIndex >= actionHistory.length - 1;
    }
}

// ==========================================
//          PROJECT SAVE/LOAD
// ==========================================

export function saveProject() {
    try {
        const projectData = {
            version: "1.2.0",
            name: projectName,
            created: new Date().toISOString(),
            sections: sections,
            settings: {
                currentSection: currentSectionId
            }
        };
        
        const jsonString = safeStringify(projectData);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName.replace(/\s+/g, '_')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('Project saved successfully');
        return true;
    } catch (error) {
        console.error('Error saving project:', error);
        return false;
    }
}

export function loadProject(projectData) {
    try {
        if (typeof projectData === 'string') {
            projectData = safeParse(projectData);
        }
        
        if (!projectData || typeof projectData !== 'object') {
            throw new Error('Invalid project data format');
        }
        
        // Save current state for undo
        const beforeState = {
            sections: deepClone(sections),
            projectName: projectName
        };
        
        // Load project data
        if (projectData.sections) {
            sections = deepClone(projectData.sections);
        }
        
        if (projectData.name) {
            projectName = projectData.name;
        }
        
        if (projectData.settings && projectData.settings.currentSection) {
            setCurrentSection(projectData.settings.currentSection);
        } else {
            const firstSectionId = Object.keys(sections)[0];
            if (firstSectionId) {
                setCurrentSection(firstSectionId);
            }
        }
        
        // Update next ID to avoid conflicts
        let maxId = 0;
        Object.values(sections).forEach(section => {
            if (section.instruments) {
                section.instruments.forEach(instrument => {
                    if (instrument.id && instrument.id > maxId) {
                        maxId = instrument.id;
                    }
                });
            }
        });
        nextId = maxId + 1;
        
        // Save action for undo
        const afterState = {
            sections: deepClone(sections),
            projectName: projectName
        };
        
        saveAction('project_change', {
            before: beforeState,
            after: afterState
        });
        
        // Update UI if functions exist
        if (typeof updateGrid === 'function') {
            updateGrid();
        }
        if (typeof renderSectionsOverview === 'function') {
            renderSectionsOverview();
        }
        if (typeof updateProjectTitle === 'function') {
            updateProjectTitle();
        }
        
        console.log('Project loaded successfully');
        return true;
    } catch (error) {
        console.error('Error loading project:', error);
        return false;
    }
}

// ==========================================
//          SESSION MANAGEMENT
// ==========================================

export function saveSession(sessionName) {
    try {
        if (!sessionName) {
            sessionName = `Session_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`;
        }
        
        const sessionData = {
            name: sessionName,
            created: new Date().toISOString(),
            projectName: projectName,
            sections: deepClone(sections),
            currentSection: currentSectionId
        };
        
        const sessionKey = `tromklub_session_${sessionName}`;
        localStorage.setItem(sessionKey, safeStringify(sessionData));
        
        console.log('Session saved:', sessionName);
        return true;
    } catch (error) {
        console.error('Error saving session:', error);
        return false;
    }
}

export function loadSession(sessionName) {
    try {
        const sessionKey = `tromklub_session_${sessionName}`;
        const sessionData = localStorage.getItem(sessionKey);
        
        if (!sessionData) {
            console.error('Session not found:', sessionName);
            return false;
        }
        
        const data = safeParse(sessionData);
        
        // Load as project
        const projectData = {
            name: data.projectName || data.name,
            sections: data.sections,
            settings: {
                currentSection: data.currentSection
            }
        };
        
        return loadProject(projectData);
    } catch (error) {
        console.error('Error loading session:', error);
        return false;
    }
}

export function getAllSavedSessions() {
    try {
        const sessions = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('tromklub_session_')) {
                const data = localStorage.getItem(key);
                if (data) {
                    const sessionData = safeParse(data);
                    if (sessionData) {
                        sessions.push({
                            key: key,
                            name: sessionData.name,
                            created: sessionData.created,
                            projectName: sessionData.projectName
                        });
                    }
                }
            }
        }
        
        return sessions.sort((a, b) => new Date(b.created) - new Date(a.created));
    } catch (error) {
        console.error('Error getting saved sessions:', error);
        return [];
    }
}

export function deleteSession(sessionName) {
    try {
        const sessionKey = `tromklub_session_${sessionName}`;
        localStorage.removeItem(sessionKey);
        console.log('Session deleted:', sessionName);
        return true;
    } catch (error) {
        console.error('Error deleting session:', error);
        return false;
    }
}

// ==========================================
//             MIDI HANDLING
// ==========================================

const MIDI_NOTE_MAPPINGS = {
    36: { name: 'C2 (Kick)', defaultSymbol: 'o' },
    38: { name: 'D2 (Snare)', defaultSymbol: 'x' },
    42: { name: 'F#2 (Closed HiHat)', defaultSymbol: '.' },
    44: { name: 'A2 (Pedal HiHat)', defaultSymbol: '+' },
    46: { name: 'B2 (Open HiHat)', defaultSymbol: 'o' },
    49: { name: 'C#3 (Crash)', defaultSymbol: 'X' },
    57: { name: 'A3 (Crash 2)', defaultSymbol: 'X' }
};

export function midiNoteToName(noteNumber) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(noteNumber / 12) - 1;
    const noteName = noteNames[noteNumber % 12];
    return `${noteName}${octave}`;
}

export function readVariableLength(data, offset) {
    let value = 0;
    let byte;
    let currentOffset = offset;
    
    do {
        if (currentOffset >= data.length) break;
        byte = data[currentOffset++];
        value = (value << 7) | (byte & 0x7F);
    } while (byte & 0x80);
    
    return { value, newOffset: currentOffset };
}

export function parseMidiTrack(trackData) {
    const events = [];
    let offset = 0;
    let currentTime = 0;
    
    while (offset < trackData.length - 4) {
        try {
            // Read delta time
            const deltaTime = readVariableLength(trackData, offset);
            offset = deltaTime.newOffset;
            currentTime += deltaTime.value;
            
            if (offset >= trackData.length) break;
            
            const eventType = trackData[offset++];
            
            // Note On events
            if ((eventType & 0xF0) === 0x90) {
                if (offset + 1 >= trackData.length) break;
                
                const note = trackData[offset++];
                const velocity = trackData[offset++];
                
                if (velocity > 0) {
                    events.push({
                        type: 'noteOn',
                        time: currentTime,
                        note: note,
                        velocity: velocity,
                        noteName: midiNoteToName(note)
                    });
                }
            }
            // Note Off events
            else if ((eventType & 0xF0) === 0x80) {
                if (offset + 1 >= trackData.length) break;
                offset += 2; // Skip note and velocity
            }
            // Meta events
            else if (eventType === 0xFF) {
                if (offset >= trackData.length) break;
                
                const metaType = trackData[offset++];
                const length = readVariableLength(trackData, offset);
                offset = length.newOffset + length.value;
            }
            // System events
            else if (eventType === 0xF0 || eventType === 0xF7) {
                const length = readVariableLength(trackData, offset);
                offset = length.newOffset + length.value;
            }
            // Other events (control change, program change, etc.)
            else {
                const eventClass = eventType & 0xF0;
                if (eventClass === 0xB0 || eventClass === 0xE0) {
                    offset += 2;
                } else if (eventClass === 0xC0 || eventClass === 0xD0) {
                    offset += 1;
                } else {
                    offset += 1;
                }
            }
        } catch (error) {
            console.warn('Error parsing MIDI event at offset', offset, ':', error);
            break;
        }
    }
    
    return events;
}

export function parseMidiFile(arrayBuffer) {
    try {
        const data = new Uint8Array(arrayBuffer);
        
        // Verify header
        const headerChunk = new TextDecoder().decode(data.slice(0, 4));
        if (headerChunk !== 'MThd') {
            throw new Error('Invalid MIDI file: Missing header chunk');
        }
        
        const headerLength = (data[4] << 24) | (data[5] << 16) | (data[6] << 8) | data[7];
        const format = (data[8] << 8) | data[9];
        const numTracks = (data[10] << 8) | data[11];
        const division = (data[12] << 8) | data[13];
        
        console.log('MIDI file info:', { format, numTracks, division });
        
        const allEvents = [];
        let offset = 14; // After header
        
        // Parse each track
        for (let trackNum = 0; trackNum < numTracks && offset < data.length; trackNum++) {
            // Find track header
            while (offset < data.length - 8) {
                const chunkId = new TextDecoder().decode(data.slice(offset, offset + 4));
                if (chunkId === 'MTrk') break;
                offset++;
            }
            
            if (offset >= data.length - 8) break;
            
            offset += 4; // Skip 'MTrk'
            const trackLength = (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
            offset += 4;
            
            if (offset + trackLength > data.length) break;
            
            const trackData = data.slice(offset, offset + trackLength);
            const trackEvents = parseMidiTrack(trackData);
            allEvents.push(...trackEvents);
            
            offset += trackLength;
        }
        
        // Sort events by time
        allEvents.sort((a, b) => a.time - b.time);
        
        return {
            success: true,
            events: allEvents,
            division: division,
            noteMapping: MIDI_NOTE_MAPPINGS
        };
    } catch (error) {
        console.error('Error parsing MIDI file:', error);
        return { success: false, error: error.message };
    }
}

// ==========================================
//         LAYOUT & THEME MANAGEMENT
// ==========================================

export function applyTheme(themeName) {
    if (THEMES[themeName]) {
        Object.assign(LAYOUT.fonts, THEMES[themeName].fonts);
        exportState.theme = themeName;
        console.log('Applied theme:', themeName);
        return true;
    }
    return false;
}

export function updatePageSize(size) {
    const sizes = {
        'A4': { width: 794, height: 1123 },
        'Letter': { width: 816, height: 1056 },
        'Legal': { width: 816, height: 1344 }
    };
    
    if (sizes[size]) {
        LAYOUT.page.width = sizes[size].width;
        LAYOUT.page.height = sizes[size].height;
        exportState.pageSize = size;
        return true;
    }
    return false;
}

export function initializeLayout() {
    // Set default theme
    applyTheme('classic-engraved');
    
    // Initialize export settings
    exportSettings.selectedSection = currentSectionId;
    
    console.log('Layout initialized');
}

// ==========================================
//         MODULE INITIALIZATION
// ==========================================

// Auto-initialize when running in browser
if (typeof window !== 'undefined') {
    // Make functions available globally for backwards compatibility
    window.sections = sections;
    window.getCurrentSection = getCurrentSection;
    window.saveAction = saveAction;
    window.undo = undo;
    window.redo = redo;
    window.saveProject = saveProject;
    window.loadProject = loadProject;
    window.saveSession = saveSession;
    window.loadSession = loadSession;
    window.parseMidiFile = parseMidiFile;
    window.LAYOUT = LAYOUT;
    window.GRID_CONFIG = GRID_CONFIG; // Add this for backwards compatibility
    window.exportState = exportState;
    window.exportSettings = exportSettings;
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeLayout);
    } else {
        initializeLayout();
    }
}

// ==========================================
//           EXPORTS TO WINDOW
// ==========================================

export function attachToWindow() {
    // Attach core configuration to window for backward compatibility
    Object.assign(window, {
        LAYOUT,
        THEMES,
        GRID_CONFIG,
        sections,
        exportState,
        exportSettings,
        
        // Core functions
        getCurrentSection,
        getSectionsAsArray,
        saveAction,
        undo,
        redo,
        
        // Break functions
        hasBreak,
        setLineBreak,
        setPageBreak,
        removeBreak,
        
        // Project management
        saveProject,
        loadProject,
        saveSession,
        loadSession,
        
        // MIDI functions
        parseMidiFile,
        
        // Initialization
        initializeLayout
    });
}

console.log('TROMKLUB Core module loaded successfully');