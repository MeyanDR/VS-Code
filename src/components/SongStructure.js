export class SongStructure {
    constructor(state, actions) {
        this.state = state;
        this.actions = actions;
        this.isCollapsed = false;
    }

    render() {
        const container = document.createElement('div');
        container.className = 'song-structure bg-slate-800 rounded-lg p-4 mt-4';
        
        // Header with toggle
        const header = document.createElement('div');
        header.className = 'flex items-center justify-between mb-4 cursor-pointer';
        header.innerHTML = `
            <h3 class="text-lg font-semibold text-white">Song Structure</h3>
            <button class="toggle-btn text-gray-400 hover:text-white transition-colors">
                ${this.isCollapsed ? '▶' : '▼'}
            </button>
        `;
        
        header.addEventListener('click', () => {
            this.isCollapsed = !this.isCollapsed;
            this.updateCollapsedState(container);
        });
        
        container.appendChild(header);
        
        // Content wrapper
        const content = document.createElement('div');
        content.className = 'song-structure-content transition-all duration-300';
        if (this.isCollapsed) {
            content.style.display = 'none';
        }
        
        // Sections list
        const sectionsList = document.createElement('div');
        sectionsList.className = 'sections-list space-y-2 mb-4';
        
        const sections = this.state.sections || [
            { id: '1', name: 'Intro', bars: 4, beats: 4 },
            { id: '2', name: 'Verse', bars: 8, beats: 4 },
            { id: '3', name: 'Chorus', bars: 8, beats: 4 }
        ];
        
        sections.forEach((section, index) => {
            const sectionCard = this.createSectionCard(section, index);
            sectionsList.appendChild(sectionCard);
        });
        
        content.appendChild(sectionsList);
        
        // Add Section button
        const addButton = document.createElement('button');
        addButton.className = 'w-full py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2';
        addButton.innerHTML = `
            <span class="text-xl">+</span>
            <span>Add Section</span>
        `;
        addButton.onclick = () => this.showAddSectionDialog();
        
        content.appendChild(addButton);
        container.appendChild(content);
        
        return container;
    }
    
    createSectionCard(section, index) {
        const card = document.createElement('div');
        card.className = 'section-card bg-slate-700 rounded-lg p-3 flex items-center justify-between group';
        card.draggable = true;
        card.dataset.sectionId = section.id;
        
        // Left side - drag handle and info
        const leftSide = document.createElement('div');
        leftSide.className = 'flex items-center gap-3';
        
        // Drag handle
        const dragHandle = document.createElement('div');
        dragHandle.className = 'cursor-move text-gray-500 hover:text-cyan-400 transition-colors';
        dragHandle.innerHTML = '≡';
        leftSide.appendChild(dragHandle);
        
        // Section info
        const info = document.createElement('div');
        info.innerHTML = `
            <div class="font-semibold text-white">${section.name}</div>
            <div class="text-sm text-gray-400">${section.bars} bars • ${section.beats} beats</div>
        `;
        leftSide.appendChild(info);
        
        card.appendChild(leftSide);
        
        // Right side - actions
        const rightSide = document.createElement('div');
        rightSide.className = 'flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'px-2 py-1 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors';
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => this.editSection(section);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'px-2 py-1 text-sm bg-red-600 hover:bg-red-500 text-white rounded transition-colors';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => this.deleteSection(section.id);
        
        rightSide.appendChild(editBtn);
        rightSide.appendChild(deleteBtn);
        card.appendChild(rightSide);
        
        // Drag event handlers
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('sectionId', section.id);
            card.classList.add('opacity-50');
        });
        
        card.addEventListener('dragend', () => {
            card.classList.remove('opacity-50');
        });
        
        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            card.classList.add('border-t-2', 'border-cyan-400');
        });
        
        card.addEventListener('dragleave', () => {
            card.classList.remove('border-t-2', 'border-cyan-400');
        });
        
        card.addEventListener('drop', (e) => {
            e.preventDefault();
            card.classList.remove('border-t-2', 'border-cyan-400');
            const draggedId = e.dataTransfer.getData('sectionId');
            if (draggedId !== section.id) {
                this.actions.reorderSection(draggedId, section.id);
            }
        });
        
        return card;
    }
    
    updateCollapsedState(container) {
        const content = container.querySelector('.song-structure-content');
        const toggleBtn = container.querySelector('.toggle-btn');
        
        if (this.isCollapsed) {
            content.style.display = 'none';
            toggleBtn.textContent = '▶';
        } else {
            content.style.display = 'block';
            toggleBtn.textContent = '▼';
        }
    }
    
    showAddSectionDialog() {
        // Create modal dialog for adding section
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        
        const dialog = document.createElement('div');
        dialog.className = 'bg-slate-800 rounded-lg p-6 w-96';
        dialog.innerHTML = `
            <h3 class="text-xl font-semibold text-white mb-4">Add New Section</h3>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Section Name</label>
                    <input type="text" id="section-name" class="w-full px-3 py-2 bg-slate-700 text-white rounded" placeholder="e.g., Verse, Chorus">
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Number of Bars</label>
                    <input type="number" id="section-bars" class="w-full px-3 py-2 bg-slate-700 text-white rounded" value="4" min="1">
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Beats per Bar</label>
                    <input type="number" id="section-beats" class="w-full px-3 py-2 bg-slate-700 text-white rounded" value="4" min="1">
                </div>
                <div class="flex gap-2 justify-end">
                    <button class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors" onclick="this.parentElement.parentElement.parentElement.parentElement.remove()">
                        Cancel
                    </button>
                    <button class="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition-colors" id="add-section-confirm">
                        Add Section
                    </button>
                </div>
            </div>
        `;
        
        dialog.querySelector('#add-section-confirm').onclick = () => {
            const name = dialog.querySelector('#section-name').value;
            const bars = parseInt(dialog.querySelector('#section-bars').value);
            const beats = parseInt(dialog.querySelector('#section-beats').value);
            
            if (name && bars && beats) {
                this.actions.addSection({ name, bars, beats });
                modal.remove();
            }
        };
        
        modal.appendChild(dialog);
        document.body.appendChild(modal);
    }
    
    editSection(section) {
        // Similar to add dialog but for editing
        console.log('Edit section:', section);
        // Implementation would be similar to showAddSectionDialog
    }
    
    deleteSection(sectionId) {
        if (confirm('Are you sure you want to delete this section?')) {
            this.actions.deleteSection(sectionId);
        }
    }
}