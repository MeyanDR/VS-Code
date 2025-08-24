export function SymbolLegend() {
    const container = document.createElement('div');
    container.className = 'symbol-legend fixed bottom-4 left-4 bg-slate-800 rounded-lg p-3 shadow-lg border border-slate-700';
    container.style.zIndex = '10';
    
    const title = document.createElement('h4');
    title.className = 'text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider';
    title.textContent = 'Symbol Legend';
    container.appendChild(title);
    
    const symbols = [
        { symbol: 'o', description: 'Dot note' },
        { symbol: 'x', description: 'Cross note' },
        { symbol: '/', description: 'Slash note' },
        { symbol: '1,2,3', description: 'Variations' },
        { symbol: '(...)', description: 'Ghost/Soft hit' },
        { symbol: '<', description: 'Accent' }
    ];
    
    const list = document.createElement('div');
    list.className = 'space-y-1';
    
    symbols.forEach(item => {
        const row = document.createElement('div');
        row.className = 'flex items-center gap-3 text-xs';
        
        const symbolSpan = document.createElement('span');
        symbolSpan.className = 'font-mono text-cyan-400 w-12';
        symbolSpan.textContent = item.symbol;
        
        const descSpan = document.createElement('span');
        descSpan.className = 'text-gray-400';
        descSpan.textContent = item.description;
        
        row.appendChild(symbolSpan);
        row.appendChild(descSpan);
        list.appendChild(row);
    });
    
    container.appendChild(list);
    
    // Collapsible toggle
    let isCollapsed = false;
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'absolute top-3 right-3 text-gray-500 hover:text-white transition-colors text-xs';
    toggleBtn.textContent = '−';
    toggleBtn.onclick = () => {
        isCollapsed = !isCollapsed;
        if (isCollapsed) {
            list.style.display = 'none';
            title.style.marginBottom = '0';
            toggleBtn.textContent = '+';
            container.style.width = 'auto';
        } else {
            list.style.display = 'block';
            title.style.marginBottom = '0.5rem';
            toggleBtn.textContent = '−';
            container.style.width = '';
        }
    };
    
    container.appendChild(toggleBtn);
    
    return container;
}