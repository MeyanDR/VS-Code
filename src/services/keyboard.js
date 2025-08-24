import * as actions from '../core/actions.js';
import { store } from '../core/state.js';

class KeyboardService {
    constructor() {
        this.isShiftPressed = false;
        this.isCtrlPressed = false;
        this.isMetaPressed = false;
        this.selectionStart = null;
        this.init();
    }

    init() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        document.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    }

    handleKeyDown(e) {
        this.isShiftPressed = e.shiftKey;
        this.isCtrlPressed = e.ctrlKey;
        this.isMetaPressed = e.metaKey;

        const isModKey = this.isCtrlPressed || this.isMetaPressed;

        // Prevent default for our shortcuts
        if (isModKey) {
            switch(e.key.toLowerCase()) {
                case 'z':
                    e.preventDefault();
                    if (this.isShiftPressed) {
                        store.dispatch(actions.redo());
                    } else {
                        store.dispatch(actions.undo());
                    }
                    break;
                case 'c':
                    e.preventDefault();
                    store.dispatch(actions.copySelection());
                    break;
                case 'x':
                    e.preventDefault();
                    store.dispatch(actions.cutSelection());
                    break;
                case 'v':
                    e.preventDefault();
                    store.dispatch(actions.pasteSelection());
                    break;
                case 'a':
                    e.preventDefault();
                    this.selectAll();
                    break;
            }
        }

        // Delete key
        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            this.deleteSelection();
        }
    }

    handleKeyUp(e) {
        this.isShiftPressed = e.shiftKey;
        this.isCtrlPressed = e.ctrlKey;
        this.isMetaPressed = e.metaKey;
    }

    handleMouseDown(e) {
        const step = e.target.closest('.drum-step');
        if (!step) return;

        const instrumentId = step.dataset.instrumentId;
        const stepIndex = parseInt(step.dataset.stepIndex);

        if (this.isCtrlPressed || this.isMetaPressed) {
            // Cmd/Ctrl+Click: Toggle note
            e.preventDefault();
            const state = store.getState();
            const instrument = state.instruments.find(i => i.id === instrumentId);
            if (instrument && instrument.pattern[stepIndex]) {
                store.dispatch(actions.removeNote(instrumentId, stepIndex));
            } else {
                const activeSymbol = state.activeSymbol || 'x';
                const activeModifier = state.activeModifier || '';
                store.dispatch(actions.addNote(instrumentId, stepIndex, activeSymbol, activeModifier));
            }
        } else if (this.isShiftPressed) {
            // Shift+Drag: Start area selection
            e.preventDefault();
            this.selectionStart = { instrumentId, stepIndex };
            store.dispatch(actions.setSelection([`${instrumentId}-${stepIndex}`]));
        }
    }

    handleMouseUp(e) {
        if (this.selectionStart && this.isShiftPressed) {
            const step = e.target.closest('.drum-step');
            if (step) {
                const endInstrumentId = step.dataset.instrumentId;
                const endStepIndex = parseInt(step.dataset.stepIndex);
                this.selectArea(this.selectionStart, { 
                    instrumentId: endInstrumentId, 
                    stepIndex: endStepIndex 
                });
            }
        }
        this.selectionStart = null;
    }

    handleMouseMove(e) {
        if (this.selectionStart && this.isShiftPressed) {
            const step = e.target.closest('.drum-step');
            if (step) {
                const currentInstrumentId = step.dataset.instrumentId;
                const currentStepIndex = parseInt(step.dataset.stepIndex);
                this.updateAreaSelection(this.selectionStart, {
                    instrumentId: currentInstrumentId,
                    stepIndex: currentStepIndex
                });
            }
        }
    }

    handleDoubleClick(e) {
        const step = e.target.closest('.drum-step');
        if (!step) return;

        e.preventDefault();
        const instrumentId = step.dataset.instrumentId;
        const stepIndex = parseInt(step.dataset.stepIndex);
        
        // Quick delete on double-click
        store.dispatch(actions.removeNote(instrumentId, stepIndex));
    }

    selectAll() {
        const state = store.getState();
        const allSteps = [];
        state.instruments.forEach(instrument => {
            const totalSteps = state.grid.bars * state.grid.beats * state.grid.subdivisions;
            for (let i = 0; i < totalSteps; i++) {
                allSteps.push(`${instrument.id}-${i}`);
            }
        });
        store.dispatch(actions.setSelection(allSteps));
    }

    selectArea(start, end) {
        const state = store.getState();
        const instruments = state.instruments;
        const startInstIndex = instruments.findIndex(i => i.id === start.instrumentId);
        const endInstIndex = instruments.findIndex(i => i.id === end.instrumentId);
        
        const minInstIndex = Math.min(startInstIndex, endInstIndex);
        const maxInstIndex = Math.max(startInstIndex, endInstIndex);
        const minStep = Math.min(start.stepIndex, end.stepIndex);
        const maxStep = Math.max(start.stepIndex, end.stepIndex);
        
        const selection = [];
        for (let i = minInstIndex; i <= maxInstIndex; i++) {
            for (let j = minStep; j <= maxStep; j++) {
                selection.push(`${instruments[i].id}-${j}`);
            }
        }
        
        store.dispatch(actions.setSelection(selection));
    }

    updateAreaSelection(start, current) {
        // Similar to selectArea but for live updating during drag
        this.selectArea(start, current);
    }

    deleteSelection() {
        const state = store.getState();
        const selection = state.selection || [];
        
        selection.forEach(stepId => {
            const [instrumentId, stepIndex] = stepId.split('-');
            store.dispatch(actions.removeNote(instrumentId, parseInt(stepIndex)));
        });
        
        store.dispatch(actions.clearSelection());
    }
}

export const keyboardService = new KeyboardService();