import { store } from '../core/state.js'

export class PatternEditor {
    constructor(state, actions) {
        this.state = state;
        this.actions = actions;
        this.selectedNoteType = 'x';
        this.selectedModifiers = new Set();
        this.patternType = 'loop';
    }

    render() {
        const container = document.createElement('div');
        container.className = 'pattern-editor bg-slate-800 border-r border-slate-700 p-4 flex flex-col gap-4';
        container.style.width = '250px';
        container.style.height = '100%';
        container.style.overflowY = 'auto';

        container.innerHTML = `
            <!-- MIDI Import Zone -->
            <div class="midi-import-zone border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-cyan-400 transition-colors cursor-pointer" id="midiDropZone">
                <div class="text-2xl mb-2">🎹</div>
                <div class="text-sm text-slate-400">MIDI Import</div>
                <div class="text-xs text-slate-500 mt-1">Drop .mid files here</div>
            </div>

            <!-- Pattern Type Toggle -->
            <div class="pattern-type">
                <label class="text-xs text-slate-400 mb-2 block">Pattern Type</label>
                <div class="flex gap-2">
                    <button class="pattern-type-btn flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors" data-type="loop">
                        Loop ∞
                    </button>
                    <button class="pattern-type-btn flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors" data-type="linear">
                        Linear ||
                    </button>
                </div>
            </div>

            <!-- Note Type Selector -->
            <div class="note-type-selector">
                <label class="text-xs text-slate-400 mb-2 block">Note Type</label>
                <div class="grid grid-cols-3 gap-2">
                    <button class="note-type-btn px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-lg font-mono transition-colors" data-note="o">
                        o
                    </button>
                    <button class="note-type-btn px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-lg font-mono transition-colors active" data-note="x">
                        x
                    </button>
                    <button class="note-type-btn px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-lg font-mono transition-colors" data-note="/">
                        /
                    </button>
                </div>
            </div>

            <!-- Modifier Buttons -->
            <div class="modifier-buttons">
                <label class="text-xs text-slate-400 mb-2 block">Modifiers</label>
                <div class="grid grid-cols-3 gap-2 mb-2">
                    <button class="modifier-btn px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors" data-modifier="1">
                        1
                    </button>
                    <button class="modifier-btn px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors" data-modifier="2">
                        2
                    </button>
                    <button class="modifier-btn px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors" data-modifier="3">
                        3
                    </button>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <button class="modifier-btn px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors" data-modifier="ghost">
                        (...)
                    </button>
                    <button class="modifier-btn px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors" data-modifier="accent">
                        &lt;
                    </button>
                </div>
            </div>

            <!-- Preview Display -->
            <div class="preview-display bg-slate-900 rounded-lg p-4 text-center">
                <label class="text-xs text-slate-400 mb-2 block">Preview</label>
                <div class="text-2xl font-mono text-cyan-400" id="notePreview">x</div>
            </div>

            <!-- Selection Tools -->
            <div class="selection-tools">
                <label class="text-xs text-slate-400 mb-2 block">Selection Tools</label>
                <div class="grid grid-cols-2 gap-2 mb-2">
                    <button class="tool-btn px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors" data-action="cut">
                        Cut
                    </button>
                    <button class="tool-btn px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors" data-action="copy">
                        Copy
                    </button>
                </div>
                <div class="grid grid-cols-2 gap-2 mb-2">
                    <button class="tool-btn px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors" data-action="paste">
                        Paste
                    </button>
                    <button class="tool-btn px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors" data-action="clear">
                        Clear
                    </button>
                </div>
                <div class="text-xs text-slate-500 mt-2">
                    Shift+Drag to select area
                </div>
            </div>
        `;

        this.attachEventListeners(container);
        return container;
    }

    attachEventListeners(container) {
        // MIDI Drop Zone
        const midiDropZone = container.querySelector('#midiDropZone');
        midiDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            midiDropZone.classList.add('border-cyan-400', 'bg-slate-700');
        });
        
        midiDropZone.addEventListener('dragleave', () => {
            midiDropZone.classList.remove('border-cyan-400', 'bg-slate-700');
        });
        
        midiDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            midiDropZone.classList.remove('border-cyan-400', 'bg-slate-700');
            const files = Array.from(e.dataTransfer.files);
            const midiFiles = files.filter(f => f.name.endsWith('.mid') || f.name.endsWith('.midi'));
            if (midiFiles.length > 0) {
                this.handleMidiImport(midiFiles[0]);
            }
        });

        // Pattern Type Toggle
        container.querySelectorAll('.pattern-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.pattern-type-btn').forEach(b => 
                    b.classList.remove('bg-cyan-600', 'hover:bg-cyan-500'));
                btn.classList.add('bg-cyan-600', 'hover:bg-cyan-500');
                this.patternType = btn.dataset.type;
                store.dispatch(this.actions.setPatternType(this.patternType));
            });
        });

        // Set initial active pattern type
        container.querySelector('[data-type="loop"]').classList.add('bg-cyan-600', 'hover:bg-cyan-500');

        // Note Type Selector
        container.querySelectorAll('.note-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.note-type-btn').forEach(b => 
                    b.classList.remove('bg-cyan-600', 'hover:bg-cyan-500'));
                btn.classList.add('bg-cyan-600', 'hover:bg-cyan-500');
                this.selectedNoteType = btn.dataset.note;
                this.updatePreview(container);
            });
        });

        // Set initial active note type
        container.querySelector('[data-note="x"]').classList.add('bg-cyan-600', 'hover:bg-cyan-500');

        // Modifier Buttons
        container.querySelectorAll('.modifier-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const modifier = btn.dataset.modifier;
                if (this.selectedModifiers.has(modifier)) {
                    this.selectedModifiers.delete(modifier);
                    btn.classList.remove('bg-cyan-600', 'hover:bg-cyan-500');
                } else {
                    // For number modifiers, only allow one at a time
                    if (['1', '2', '3'].includes(modifier)) {
                        ['1', '2', '3'].forEach(num => {
                            this.selectedModifiers.delete(num);
                            const numBtn = container.querySelector(`[data-modifier="${num}"]`);
                            if (numBtn) numBtn.classList.remove('bg-cyan-600', 'hover:bg-cyan-500');
                        });
                    }
                    this.selectedModifiers.add(modifier);
                    btn.classList.add('bg-cyan-600', 'hover:bg-cyan-500');
                }
                this.updatePreview(container);
            });
        });

        // Selection Tools
        container.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.handleSelectionAction(action);
            });
        });
    }

    updatePreview(container) {
        const preview = container.querySelector('#notePreview');
        let display = this.selectedNoteType;
        
        // Add number modifier if present
        ['1', '2', '3'].forEach(num => {
            if (this.selectedModifiers.has(num)) {
                display += num;
            }
        });
        
        // Add ghost notation
        if (this.selectedModifiers.has('ghost')) {
            display = `(${display})`;
        }
        
        // Add accent
        if (this.selectedModifiers.has('accent')) {
            display = `<${display}`;
        }
        
        preview.textContent = display;
    }

    handleMidiImport(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            // Dispatch MIDI import action
            store.dispatch(this.actions.importMidi(e.target.result));
        };
        reader.readAsArrayBuffer(file);
    }

    handleSelectionAction(action) {
        switch(action) {
            case 'cut':
                store.dispatch(this.actions.cutSelection());
                break;
            case 'copy':
                store.dispatch(this.actions.copySelection());
                break;
            case 'paste':
                store.dispatch(this.actions.pasteSelection());
                break;
            case 'clear':
                store.dispatch(this.actions.clearSelection());
                break;
        }
    }

    getSelectedPattern() {
        return {
            noteType: this.selectedNoteType,
            modifiers: Array.from(this.selectedModifiers),
            patternType: this.patternType
        };
    }
}