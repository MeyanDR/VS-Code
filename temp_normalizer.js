
// Normalize section data to ensure consistent structure for rendering
function normalizeDataForRender(rawSection) {
    if (!rawSection) {
        console.warn('⚠️ No section provided for normalization');
        return null;
    }
    
    const normalized = {
        name: rawSection.name || 'Untitled Section',
        bars: Math.max(1, parseInt(rawSection.bars) || 4),
        beats: Math.max(1, parseInt(rawSection.beats) || 4),
        subdivision: Math.max(1, parseInt(rawSection.subdivision) || 4),
        notes: rawSection.notes || '',
        breaks: Array.isArray(rawSection.breaks) ? rawSection.breaks : [],
        groups: rawSection.groups || {},
        patternType: rawSection.patternType || 'loop',
        id: rawSection.id,
        data: []
    };
    
    const totalSteps = normalized.bars * normalized.beats * normalized.subdivision;
    
    if (Array.isArray(rawSection.data)) {
        rawSection.data.forEach((rawInstrument, index) => {
            if (!rawInstrument) return;
            
            const normalizedInstrument = {
                name: rawInstrument.name || `Instrument ${index + 1}`,
                visible: rawInstrument.visible !== false,
                groupId: rawInstrument.groupId || null,
                pattern: [],
                steps: []
            };
            
            let rawPattern = rawInstrument.pattern || rawInstrument.steps || [];
            if (typeof rawPattern === 'string') {
                rawPattern = rawPattern.split('');
            } else if (!Array.isArray(rawPattern)) {
                rawPattern = [];
            }
            
            for (let i = 0; i < totalSteps; i++) {
                const value = (i < rawPattern.length && rawPattern[i] != null) ? String(rawPattern[i]) : '';
                normalizedInstrument.pattern[i] = value;
            }
            
            normalizedInstrument.steps = [...normalizedInstrument.pattern];
            normalized.data.push(normalizedInstrument);
        });
    }
    
    console.log(`✅ Normalized ${normalized.data.length} instruments, ${totalSteps} steps each`);
    return normalized;
}

