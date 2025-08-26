/* ========================================== */
/*              TROMKLUB UI MODULE           */
/*        UI Controls & Event Handlers       */
/* ========================================== */

import { getCurrentSection, saveAction, sections, currentSectionId } from './core.js';
import { debounce, validateNumber, sanitizeInput, generateId } from './utils.js';

// ==========================================
//              UI STATE & CONFIG
// ==========================================

export const uiState = {
    isSelecting: false,
    isDragging: false,
    selectedSteps: new Set(),
    currentSymbol: 'x',
    currentModifiers: { super: '', sub: '' },
    activeModal: null,
    exportPanelState: {},
    zoomLevel: 1.0
};

export const modalConfig = {
    editInstrument: { id: 'editInstrumentModal', backdrop: true },
    subdivision: { id: 'subdivisionModal', backdrop: true },
    export: { id: 'exportModal', backdrop: false, class: 'export-overlay' },
    sessionList: { id: 'sessionListModal', backdrop: true }
};

// ==========================================
//            MODAL MANAGEMENT
// ==========================================

export function showModal(modalName, options = {}) {
    try {
        const config = modalConfig[modalName];
        if (!config) {
            console.error('Unknown modal:', modalName);
            return false;
        }
        
        const modal = document.getElementById(config.id);
        if (!modal) {
            console.error('Modal element not found:', config.id);
            return false;
        }
        
        // Close any existing modal
        hideModal();
        
        // Show new modal
        modal.style.display = config.class === 'export-overlay' ? 'flex' : 'flex';
        uiState.activeModal = modalName;
        
        // Setup backdrop click handler
        if (config.backdrop) {
            modal.addEventListener('click', handleBackdropClick);
        }
        
        // Initialize modal content if needed
        if (options.init && typeof options.init === 'function') {
            options.init();
        }
        
        return true;
    } catch (error) {
        console.error('Error showing modal:', error);
        return false;
    }
}

export function hideModal(modalName = null) {
    try {
        if (modalName && modalConfig[modalName]) {
            const modal = document.getElementById(modalConfig[modalName].id);
            if (modal) {
                modal.style.display = 'none';
                modal.removeEventListener('click', handleBackdropClick);
            }
        } else if (uiState.activeModal) {
            const config = modalConfig[uiState.activeModal];
            if (config) {
                const modal = document.getElementById(config.id);
                if (modal) {
                    modal.style.display = 'none';
                    modal.removeEventListener('click', handleBackdropClick);
                }
            }
        }
        
        uiState.activeModal = null;
        return true;
    } catch (error) {
        console.error('Error hiding modal:', error);
        return false;
    }
}

function handleBackdropClick(event) {
    if (event.target.classList.contains('modal')) {
        hideModal();
    }
}

// ==========================================
//           EVENT HANDLERS
// ==========================================

export function setupEventHandlers() {
    try {
        // Button event handlers
        setupButtonHandlers();
        
        // Form event handlers
        setupFormHandlers();
        
        // Keyboard event handlers
        setupKeyboardHandlers();
        
        // Selection event handlers
        setupSelectionHandlers();
        
        console.log('Event handlers setup complete');
        return true;
    } catch (error) {
        console.error('Error setting up event handlers:', error);
        return false;
    }
}

function setupButtonHandlers() {
    const buttonHandlers = {
        'newBtn': () => createNewProject(),
        'undoBtn': () => window.undo && window.undo(),
        'redoBtn': () => window.redo && window.redo(),
        'saveBtn': () => window.saveProject && window.saveProject(),
        'loadBtn': () => triggerFileLoad(),
        'exportBtn': () => showModal('export', { init: initializeExportModal }),
        'clearBtn': () => confirmClearProject(),
        'copyBtn': () => copySelection(),
        'cutBtn': () => cutSelection(),
        'pasteBtn': () => pasteSelection()
    };
    
    Object.entries(buttonHandlers).forEach(([id, handler]) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', handler);
        }
    });
}

function setupFormHandlers() {
    // Grid configuration handlers
    const gridControls = ['barsInput', 'beatsInput', 'subdivisionInput'];
    gridControls.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('change', debounce(updateGridConfiguration, 300));
        }
    });
    
    // Symbol and modifier handlers
    setupSymbolControls();
    setupModifierControls();
}

function setupKeyboardHandlers() {
    document.addEventListener('keydown', (event) => {
        // Skip if typing in input
        if (event.target.tagName.toLowerCase() === 'input' || 
            event.target.tagName.toLowerCase() === 'textarea') {
            return;
        }
        
        const key = event.key.toLowerCase();
        const ctrl = event.ctrlKey || event.metaKey;
        const shift = event.shiftKey;
        
        // Global shortcuts
        if (ctrl) {
            switch (key) {
                case 'z':
                    event.preventDefault();
                    if (shift) {
                        window.redo && window.redo();
                    } else {
                        window.undo && window.undo();
                    }
                    break;
                case 's':
                    event.preventDefault();
                    window.saveProject && window.saveProject();
                    break;
                case 'c':
                    if (uiState.selectedSteps.size > 0) {
                        event.preventDefault();
                        copySelection();
                    }
                    break;
                case 'v':
                    event.preventDefault();
                    pasteSelection();
                    break;
                case 'x':
                    if (uiState.selectedSteps.size > 0) {
                        event.preventDefault();
                        cutSelection();
                    }
                    break;
            }
        }
        
        // Step navigation shortcuts
        handleStepNavigationKeys(event);
    });
}

function setupSelectionHandlers() {
    document.addEventListener('mousedown', handleSelectionStart);
    document.addEventListener('mousemove', handleSelectionMove);
    document.addEventListener('mouseup', handleSelectionEnd);
}

// ==========================================
//           UI UPDATE FUNCTIONS
// ==========================================

export function updateGrid() {
    try {
        const section = getCurrentSection();
        if (!section) return false;
        
        renderSequencer();
        updateSelectionButtons();
        
        return true;
    } catch (error) {
        console.error('Error updating grid:', error);
        return false;
    }
}

export function renderSequencer() {
    try {
        const section = getCurrentSection();
        const container = document.querySelector('.instrument-section');
        
        if (!container || !section) return false;
        
        // Clear existing content
        container.innerHTML = '';
        
        // Create bars
        for (let barIndex = 0; barIndex < section.bars; barIndex++) {
            const barSection = createBarSection(section, barIndex);
            container.appendChild(barSection);
        }
        
        return true;
    } catch (error) {
        console.error('Error rendering sequencer:', error);
        return false;
    }
}

function createBarSection(section, barIndex) {
    const barDiv = document.createElement('div');
    barDiv.className = 'bar-section';
    
    // Bar header
    const headerDiv = document.createElement('div');
    headerDiv.className = 'bar-section-header';
    headerDiv.textContent = `Bar ${barIndex + 1}`;
    barDiv.appendChild(headerDiv);
    
    // Create instrument rows
    section.instruments.forEach(instrument => {
        const rowDiv = createInstrumentRow(section, instrument, barIndex);
        barDiv.appendChild(rowDiv);
    });
    
    return barDiv;
}

function createInstrumentRow(section, instrument, barIndex) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'instrument-row';
    rowDiv.dataset.instrumentId = instrument.id;
    
    // Instrument label
    const labelDiv = document.createElement('div');
    labelDiv.className = 'instrument-label';
    labelDiv.textContent = instrument.name;
    labelDiv.addEventListener('click', () => editInstrument(instrument.id));
    rowDiv.appendChild(labelDiv);
    
    // Create steps for this bar
    const stepsContainer = document.createElement('div');
    stepsContainer.className = 'steps-container';
    
    for (let beatIndex = 0; beatIndex < section.beats; beatIndex++) {
        const beatContainer = createBeatContainer(section, instrument, barIndex, beatIndex);
        stepsContainer.appendChild(beatContainer);
    }
    
    rowDiv.appendChild(stepsContainer);
    return rowDiv;
}

function createBeatContainer(section, instrument, barIndex, beatIndex) {
    const beatDiv = document.createElement('div');
    beatDiv.className = 'beat-container';
    
    const stepsDiv = document.createElement('div');
    stepsDiv.className = 'beat-steps';
    
    for (let stepIndex = 0; stepIndex < section.subdivision; stepIndex++) {
        const stepElement = createStepElement(section, instrument, barIndex, beatIndex, stepIndex);
        stepsDiv.appendChild(stepElement);
    }
    
    beatDiv.appendChild(stepsDiv);
    return beatDiv;
}

function createStepElement(section, instrument, barIndex, beatIndex, stepIndex) {
    const stepKey = `${barIndex}-${beatIndex}-${stepIndex}`;
    const step = instrument.steps[stepKey];
    
    const stepDiv = document.createElement('div');
    stepDiv.className = 'step';
    stepDiv.dataset.instrumentId = instrument.id;
    stepDiv.dataset.stepKey = stepKey;
    
    if (stepIndex === 0) {
        stepDiv.classList.add('beat-start');
    }
    
    if (step) {
        stepDiv.classList.add('active');
        
        // Create step content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'step-content';
        
        const mainDiv = document.createElement('div');
        mainDiv.className = 'step-main';
        mainDiv.textContent = step.symbol || 'x';
        contentDiv.appendChild(mainDiv);
        
        // Add modifiers
        if (step.modifiers) {
            if (step.modifiers.super) {
                const superDiv = document.createElement('div');
                superDiv.className = 'step-super';
                superDiv.textContent = step.modifiers.super;
                contentDiv.appendChild(superDiv);
            }
            
            if (step.modifiers.sub) {
                const subDiv = document.createElement('div');
                subDiv.className = 'step-sub';
                subDiv.textContent = step.modifiers.sub;
                contentDiv.appendChild(subDiv);
            }
        }
        
        stepDiv.appendChild(contentDiv);
    }
    
    // Add event listeners
    stepDiv.addEventListener('click', (event) => handleStepClick(event, stepDiv));
    stepDiv.addEventListener('mouseenter', (event) => handleStepHover(event, stepDiv));
    
    return stepDiv;
}

// ==========================================
//           SELECTION SYSTEM
// ==========================================

export function clearStepSelection() {
    uiState.selectedSteps.clear();
    document.querySelectorAll('.step.selected').forEach(step => {
        step.classList.remove('selected');
    });
    updateSelectionButtons();
}

export function selectStep(stepElement) {
    if (!stepElement.dataset.stepKey) return false;
    
    const stepId = `${stepElement.dataset.instrumentId}-${stepElement.dataset.stepKey}`;
    uiState.selectedSteps.add(stepId);
    stepElement.classList.add('selected');
    updateSelectionButtons();
    
    return true;
}

export function deselectStep(stepElement) {
    if (!stepElement.dataset.stepKey) return false;
    
    const stepId = `${stepElement.dataset.instrumentId}-${stepElement.dataset.stepKey}`;
    uiState.selectedSteps.delete(stepId);
    stepElement.classList.remove('selected');
    updateSelectionButtons();
    
    return true;
}

function updateSelectionButtons() {
    const hasSelection = uiState.selectedSteps.size > 0;
    const buttons = ['copyBtn', 'cutBtn', 'pasteBtn'];
    
    buttons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.disabled = id === 'pasteBtn' ? false : !hasSelection;
        }
    });
}

function handleSelectionStart(event) {
    if (!event.target.classList.contains('step')) return;
    
    if (event.shiftKey) {
        uiState.isSelecting = true;
        document.body.classList.add('shift-selection');
        event.preventDefault();
    }
}

function handleSelectionMove(event) {
    if (!uiState.isSelecting) return;
    
    // Implementation for drag selection would go here
    // This is a simplified version
}

function handleSelectionEnd(event) {
    if (uiState.isSelecting) {
        uiState.isSelecting = false;
        document.body.classList.remove('shift-selection');
    }
}

// ==========================================
//           STEP INTERACTION
// ==========================================

function handleStepClick(event, stepElement) {
    try {
        if (event.shiftKey) {
            // Toggle selection
            if (stepElement.classList.contains('selected')) {
                deselectStep(stepElement);
            } else {
                selectStep(stepElement);
            }
            return;
        }
        
        // Regular step toggle
        const instrumentId = parseInt(stepElement.dataset.instrumentId);
        const stepKey = stepElement.dataset.stepKey;
        
        if (!instrumentId || !stepKey) return;
        
        toggleStep(instrumentId, stepKey);
        
    } catch (error) {
        console.error('Error handling step click:', error);
    }
}

function handleStepHover(event, stepElement) {
    if (!uiState.isDragging) return;
    
    // Implementation for drag painting would go here
}

function toggleStep(instrumentId, stepKey) {
    try {
        const section = getCurrentSection();
        if (!section) return false;
        
        const instrument = section.instruments.find(i => i.id === instrumentId);
        if (!instrument) return false;
        
        const beforeSteps = { ...instrument.steps };
        
        if (instrument.steps[stepKey]) {
            // Remove step
            delete instrument.steps[stepKey];
        } else {
            // Add step
            instrument.steps[stepKey] = {
                symbol: uiState.currentSymbol,
                modifiers: { ...uiState.currentModifiers }
            };
        }
        
        const afterSteps = { ...instrument.steps };
        
        // Save action for undo
        saveAction('step_change', {
            sectionId: currentSectionId,
            instrumentId: instrumentId,
            before: { steps: beforeSteps },
            after: { steps: afterSteps }
        });
        
        // Update UI
        updateGrid();
        
        return true;
    } catch (error) {
        console.error('Error toggling step:', error);
        return false;
    }
}

// ==========================================
//           SYMBOL & MODIFIER CONTROLS
// ==========================================

function setupSymbolControls() {
    const symbolButtons = document.querySelectorAll('.note-symbol');
    symbolButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            selectSymbol(btn.textContent.trim());
            updateSymbolButtons(btn);
        });
    });
}

function setupModifierControls() {
    const modifierButtons = document.querySelectorAll('.note-modifier');
    modifierButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleModifier(btn);
        });
    });
}

function selectSymbol(symbol) {
    uiState.currentSymbol = symbol;
    updateSymbolPreview();
}

function toggleModifier(modifierBtn) {
    const modifier = modifierBtn.textContent.trim();
    const type = modifierBtn.dataset.type || 'super';
    
    if (modifierBtn.classList.contains('active')) {
        modifierBtn.classList.remove('active');
        uiState.currentModifiers[type] = '';
    } else {
        // Deactivate other modifiers of same type
        document.querySelectorAll(`.note-modifier[data-type="${type}"].active`).forEach(btn => {
            btn.classList.remove('active');
        });
        
        modifierBtn.classList.add('active');
        uiState.currentModifiers[type] = modifier;
    }
    
    updateSymbolPreview();
}

function updateSymbolButtons(activeBtn) {
    document.querySelectorAll('.note-symbol').forEach(btn => {
        btn.classList.remove('active');
    });
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

function updateSymbolPreview() {
    const preview = document.querySelector('.symbol-preview');
    if (!preview) return;
    
    let previewText = uiState.currentSymbol;
    
    // Add visual representation of modifiers
    if (uiState.currentModifiers.super) {
        previewText += `^${uiState.currentModifiers.super}`;
    }
    if (uiState.currentModifiers.sub) {
        previewText += `_${uiState.currentModifiers.sub}`;
    }
    
    preview.textContent = previewText;
}

// ==========================================
//           CLIPBOARD OPERATIONS
// ==========================================

let clipboardData = null;

export function copySelection() {
    try {
        if (uiState.selectedSteps.size === 0) return false;
        
        const section = getCurrentSection();
        if (!section) return false;
        
        clipboardData = [];
        
        uiState.selectedSteps.forEach(stepId => {
            const [instrumentId, stepKey] = stepId.split('-', 2);
            const instrument = section.instruments.find(i => i.id === parseInt(instrumentId));
            
            if (instrument && instrument.steps[stepKey]) {
                clipboardData.push({
                    instrumentId: parseInt(instrumentId),
                    stepKey: stepKey,
                    step: { ...instrument.steps[stepKey] }
                });
            }
        });
        
        updateSelectionButtons();
        console.log('Copied', clipboardData.length, 'steps');
        return true;
    } catch (error) {
        console.error('Error copying selection:', error);
        return false;
    }
}

export function cutSelection() {
    try {
        if (!copySelection()) return false;
        
        // Delete selected steps
        const section = getCurrentSection();
        if (!section) return false;
        
        const beforeState = { ...section };
        
        uiState.selectedSteps.forEach(stepId => {
            const [instrumentId, stepKey] = stepId.split('-', 2);
            const instrument = section.instruments.find(i => i.id === parseInt(instrumentId));
            
            if (instrument && instrument.steps[stepKey]) {
                delete instrument.steps[stepKey];
            }
        });
        
        const afterState = { ...section };
        
        saveAction('section_change', {
            sectionId: currentSectionId,
            before: beforeState,
            after: afterState
        });
        
        clearStepSelection();
        updateGrid();
        
        console.log('Cut steps');
        return true;
    } catch (error) {
        console.error('Error cutting selection:', error);
        return false;
    }
}

export function pasteSelection() {
    try {
        if (!clipboardData || clipboardData.length === 0) {
            console.log('Nothing to paste');
            return false;
        }
        
        const section = getCurrentSection();
        if (!section) return false;
        
        const beforeState = { ...section };
        
        clipboardData.forEach(item => {
            const instrument = section.instruments.find(i => i.id === item.instrumentId);
            if (instrument) {
                instrument.steps[item.stepKey] = { ...item.step };
            }
        });
        
        const afterState = { ...section };
        
        saveAction('section_change', {
            sectionId: currentSectionId,
            before: beforeState,
            after: afterState
        });
        
        updateGrid();
        console.log('Pasted', clipboardData.length, 'steps');
        return true;
    } catch (error) {
        console.error('Error pasting selection:', error);
        return false;
    }
}

// ==========================================
//           UTILITY FUNCTIONS
// ==========================================

function updateGridConfiguration() {
    const section = getCurrentSection();
    if (!section) return;
    
    const bars = validateNumber(document.getElementById('barsInput')?.value, 1, 32, 4);
    const beats = validateNumber(document.getElementById('beatsInput')?.value, 1, 16, 4);
    const subdivision = validateNumber(document.getElementById('subdivisionInput')?.value, 1, 8, 4);
    
    const beforeState = { ...section };
    
    section.bars = bars;
    section.beats = beats;
    section.subdivision = subdivision;
    
    const afterState = { ...section };
    
    saveAction('section_change', {
        sectionId: currentSectionId,
        before: beforeState,
        after: afterState
    });
    
    updateGrid();
}

function handleStepNavigationKeys(event) {
    // Implementation for keyboard navigation between steps
    // This would allow arrow key navigation through the grid
}

function createNewProject() {
    if (confirm('Create new project? Current work will be lost.')) {
        // Reset to default state
        window.location.reload();
    }
}

function confirmClearProject() {
    if (confirm('Clear all patterns? This cannot be undone.')) {
        const section = getCurrentSection();
        if (!section) return;
        
        const beforeState = { ...section };
        
        section.instruments.forEach(instrument => {
            instrument.steps = {};
        });
        
        const afterState = { ...section };
        
        saveAction('section_change', {
            sectionId: currentSectionId,
            before: beforeState,
            after: afterState
        });
        
        updateGrid();
    }
}

function triggerFileLoad() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const projectData = JSON.parse(e.target.result);
                    if (window.loadProject) {
                        window.loadProject(projectData);
                    }
                } catch (error) {
                    alert('Error loading file: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
    });
    input.click();
}

function editInstrument(instrumentId) {
    // Implementation for instrument editing modal
    console.log('Edit instrument:', instrumentId);
}

function initializeExportModal() {
    // Implementation for export modal initialization
    console.log('Initialize export modal');
}

// ==========================================
//         MODULE INITIALIZATION
// ==========================================

export function initializeUI() {
    try {
        setupEventHandlers();
        updateGrid();
        updateSymbolPreview();
        
        console.log('UI initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing UI:', error);
        return false;
    }
}

// Make functions available globally for backwards compatibility
export function attachToWindow() {
    if (typeof window !== 'undefined') {
        window.showModal = showModal;
        window.hideModal = hideModal;
        window.updateGrid = updateGrid;
        window.renderSequencer = renderSequencer;
        window.clearStepSelection = clearStepSelection;
        window.copySelection = copySelection;
        window.cutSelection = cutSelection;
        window.pasteSelection = pasteSelection;
        window.selectStep = selectStep;
        window.deselectStep = deselectStep;
        window.initializeUI = initializeUI;
        window.uiState = uiState;
        window.modalConfig = modalConfig;
    }
}

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
    attachToWindow();
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeUI);
    } else {
        initializeUI();
    }
}

console.log('TROMKLUB UI module loaded successfully');