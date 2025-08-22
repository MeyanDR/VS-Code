// ==========================================
// BLOCK-BASED EXPORT SYSTEM
// ==========================================

// Block-based export styles system
let exportStyles = {
    title: {
        fontFamily: 'Times New Roman',
        fontSize: 18,
        fontWeight: 'bold',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center'
    },
    section: {
        fontFamily: 'Times New Roman',
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'left'
    },
    sectionNotes: {
        fontFamily: 'Times New Roman',
        fontSize: 12,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'left'
    },
    barHeader: {
        fontFamily: 'Times New Roman',
        fontSize: 14,
        fontWeight: 'bold',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'left'
    },
    beatNumbers: {
        fontFamily: 'Times New Roman',
        fontSize: 10,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center'
    },
    namesGrid: {
        fontFamily: 'Times New Roman',
        fontSize: 12,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'left'
    }
};

let currentSelectedBlock = 'title';

// Theme presets
const themePresets = {
    classic: {
        title: { fontFamily: 'Times New Roman', fontSize: 16, fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left' },
        section: { fontFamily: 'Times New Roman', fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left' },
        sectionNotes: { fontFamily: 'Times New Roman', fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left' },
        barHeader: { fontFamily: 'Times New Roman', fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left' },
        beatNumbers: { fontFamily: 'Times New Roman', fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'center' },
        namesGrid: { fontFamily: 'Times New Roman', fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left' }
    },
    modern: {
        title: { fontFamily: 'Helvetica Neue', fontSize: 18, fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'center' },
        section: { fontFamily: 'Helvetica Neue', fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'center' },
        sectionNotes: { fontFamily: 'Helvetica Neue', fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'center' },
        barHeader: { fontFamily: 'Helvetica Neue', fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'center' },
        beatNumbers: { fontFamily: 'Helvetica Neue', fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'center' },
        namesGrid: { fontFamily: 'Helvetica Neue', fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'center' }
    },
    minimal: {
        title: { fontFamily: 'Arial', fontSize: 15, fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left' },
        section: { fontFamily: 'Arial', fontSize: 11, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left' },
        sectionNotes: { fontFamily: 'Arial', fontSize: 11, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left' },
        barHeader: { fontFamily: 'Arial', fontSize: 11, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left' },
        beatNumbers: { fontFamily: 'Arial', fontSize: 11, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'center' },
        namesGrid: { fontFamily: 'Arial', fontSize: 11, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left' }
    },
    mono: {
        title: { fontFamily: 'Courier New', fontSize: 16, fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'center' },
        section: { fontFamily: 'Courier New', fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'center' },
        sectionNotes: { fontFamily: 'Courier New', fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'center' },
        barHeader: { fontFamily: 'Courier New', fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'center' },
        beatNumbers: { fontFamily: 'Courier New', fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'center' },
        namesGrid: { fontFamily: 'Courier New', fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'center' }
    },
    wide: {
        title: { fontFamily: 'Verdana', fontSize: 17, fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left' },
        section: { fontFamily: 'Verdana', fontSize: 13, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left' },
        sectionNotes: { fontFamily: 'Verdana', fontSize: 13, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left' },
        barHeader: { fontFamily: 'Verdana', fontSize: 13, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left' },
        beatNumbers: { fontFamily: 'Verdana', fontSize: 13, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'center' },
        namesGrid: { fontFamily: 'Verdana', fontSize: 13, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left' }
    },
    jazz: {
        title: { fontFamily: 'Georgia', fontSize: 17, fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'right' },
        section: { fontFamily: 'Georgia', fontSize: 13, fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'right' },
        sectionNotes: { fontFamily: 'Georgia', fontSize: 13, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'right' },
        barHeader: { fontFamily: 'Georgia', fontSize: 13, fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'right' },
        beatNumbers: { fontFamily: 'Georgia', fontSize: 13, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'center' },
        namesGrid: { fontFamily: 'Georgia', fontSize: 13, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'right' }
    }
};

// Block control functions
function selectBlock(blockType) {
    currentSelectedBlock = blockType;
    updateBlockControls();
}

function updateBlockControls() {
    const style = exportStyles[currentSelectedBlock];
    if (!style) return;

    const fontSelect = document.getElementById('fontFamilySelect');
    const sizeInput = document.getElementById('fontSizeInput');
    const boldBtn = document.getElementById('boldBtn');
    const italicBtn = document.getElementById('italicBtn');
    const underlineBtn = document.getElementById('underlineBtn');

    if (fontSelect) fontSelect.value = style.fontFamily;
    if (sizeInput) sizeInput.value = style.fontSize;
    
    if (boldBtn) boldBtn.classList.toggle('active', style.fontWeight === 'bold');
    if (italicBtn) italicBtn.classList.toggle('active', style.fontStyle === 'italic');
    if (underlineBtn) underlineBtn.classList.toggle('active', style.textDecoration === 'underline');
}

function updateBlockStyle(property, value) {
    if (!exportStyles[currentSelectedBlock]) return;
    exportStyles[currentSelectedBlock][property] = value;
    renderExportPreview();
}

function changeFontSize(delta) {
    const currentSize = exportStyles[currentSelectedBlock].fontSize;
    const newSize = Math.max(8, Math.min(48, currentSize + delta));
    updateBlockStyle('fontSize', newSize);
    
    const sizeInput = document.getElementById('fontSizeInput');
    if (sizeInput) sizeInput.value = newSize;
}

function toggleStyle(property) {
    const style = exportStyles[currentSelectedBlock];
    switch (property) {
        case 'fontWeight':
            style.fontWeight = style.fontWeight === 'bold' ? 'normal' : 'bold';
            break;
        case 'fontStyle':
            style.fontStyle = style.fontStyle === 'italic' ? 'normal' : 'italic';
            break;
        case 'textDecoration':
            style.textDecoration = style.textDecoration === 'underline' ? 'none' : 'underline';
            break;
    }
    updateBlockControls();
    renderExportPreview();
}

function resetStyles() {
    const style = exportStyles[currentSelectedBlock];
    style.fontWeight = 'normal';
    style.fontStyle = 'normal';
    style.textDecoration = 'none';
    updateBlockControls();
    renderExportPreview();
}

function applyTheme(themeName) {
    if (!themeName || !themePresets[themeName]) return;
    
    const theme = themePresets[themeName];
    for (const blockType in theme) {
        if (exportStyles[blockType]) {
            Object.assign(exportStyles[blockType], theme[blockType]);
        }
    }
    
    updateBlockControls();
    renderExportPreview();
    
    // Reset theme selector
    const themeSelector = document.getElementById('themeSelector');
    if (themeSelector) themeSelector.value = '';
}

// New renderExportPreview function with block-based layout
function renderExportPreview() {
    const canvas = document.getElementById('exportPreviewCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    renderExportPreviewToContext(ctx, canvas.width, canvas.height);
}

function renderExportPreviewToContext(ctx, width, height) {
    const section = getCurrentSection();
    if (!section) return;
    
    const instruments = section.data.filter(inst => inst.visible !== false) || [];
    if (instruments.length === 0) return;
    
    // Use the same clean rendering function
    const canvas = { width: width, height: height };
    renderBreak2Layout(ctx, canvas, section, instruments);
    return;
    
    const totalBars = section.bars || 4;
    const beatsPerBar = section.beats || 4;
    const defaultSubdivision = section.subdivision || 4;
    
    // Page layout constants
    const pageLeftX = 40;
    const pageWidth = width - 80;
    const textColumnWidth = pageWidth - 2 * pageLeftX;
    const nameColumnWidth = 110;
    const nameGap = 10;
    const gridStartX = pageLeftX + nameColumnWidth + nameGap;
    const beatGap = 2;
    const stepSize = 30;
    const rowHeight = 60;
    
    // Block spacing constants (as specified)
    const blockSpacing = 12;
    const barHeaderBeatSpacing = 8;
    const beatGridSpacing = 12;
    
    // Helper function to apply text styles
    function applyTextStyle(ctx, blockType) {
        const style = exportStyles[blockType];
        if (!style) return;
        
        const weight = style.fontWeight === 'bold' ? 'bold' : 'normal';
        const styleStr = style.fontStyle === 'italic' ? 'italic' : 'normal';
        
        ctx.font = `${styleStr} ${weight} ${style.fontSize}px ${style.fontFamily}`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = style.textAlign;
        ctx.textBaseline = 'top';
    }
    
    // Helper function to get text alignment X position
    function getAlignmentX(blockType, columnLeft, columnWidth) {
        const align = exportStyles[blockType].textAlign;
        switch (align) {
            case 'center': return columnLeft + columnWidth / 2;
            case 'right': return columnLeft + columnWidth;
            default: return columnLeft;
        }
    }
    
    // Block positioning system
    let currentY = 40;
    
    // 1. Title Block (mandatory)
    applyTextStyle(ctx, 'title');
    const titleX = getAlignmentX('title', pageLeftX, textColumnWidth);
    ctx.fillText(section.name || 'Untitled Section', titleX, currentY);
    currentY += exportStyles.title.fontSize + blockSpacing;
    
    // 2. Section Block (mandatory)
    applyTextStyle(ctx, 'section');
    const sectionX = getAlignmentX('section', pageLeftX, textColumnWidth);
    const sectionText = `Section: ${section.name || 'Untitled Section'}`;
    ctx.fillText(sectionText, sectionX, currentY);
    currentY += exportStyles.section.fontSize + blockSpacing;
    
    // 3. Section Notes Block (optional - only if content exists)
    const sectionNotes = section.notes || '';
    if (sectionNotes.trim()) {
        applyTextStyle(ctx, 'sectionNotes');
        const notesX = getAlignmentX('sectionNotes', pageLeftX, textColumnWidth);
        
        // Word wrap for section notes
        const words = sectionNotes.split(' ');
        const lines = [];
        let currentLine = '';
        
        for (const word of words) {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > textColumnWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);
        
        const notesHeight = lines.length * exportStyles.sectionNotes.fontSize + 6;
        currentY += 3; // padding above
        
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], notesX, currentY + i * exportStyles.sectionNotes.fontSize);
        }
        
        currentY += notesHeight + blockSpacing;
    }
    
    // 4. Bar Header Block (mandatory)
    applyTextStyle(ctx, 'barHeader');
    
    // Render bar headers
    for (let bar = 0; bar < totalBars; bar++) {
        const barStartX = gridStartX + (bar * beatsPerBar * defaultSubdivision * stepSize) + (bar * beatsPerBar * beatGap);
        const barText = `Bar ${bar + 1}`;
        if (exportStyles.barHeader.textAlign === 'center') {
            const barWidth = beatsPerBar * defaultSubdivision * stepSize + (beatsPerBar - 1) * beatGap;
            ctx.fillText(barText, barStartX + barWidth / 2, currentY);
        } else {
            ctx.fillText(barText, barStartX, currentY);
        }
    }
    currentY += exportStyles.barHeader.fontSize + barHeaderBeatSpacing;
    
    // 5. Beat Numbers Block (mandatory)
    applyTextStyle(ctx, 'beatNumbers');
    
    for (let bar = 0; bar < totalBars; bar++) {
        for (let beat = 0; beat < beatsPerBar; beat++) {
            const beatStartX = gridStartX + (bar * beatsPerBar * defaultSubdivision * stepSize) + 
                             (bar * beatsPerBar * beatGap) + (beat * defaultSubdivision * stepSize) + (beat * beatGap);
            const beatCenterX = beatStartX + (defaultSubdivision * stepSize) / 2;
            const beatLabel = `${bar + 1}.${beat + 1}`;
            ctx.fillText(beatLabel, beatCenterX, currentY);
        }
    }
    currentY += exportStyles.beatNumbers.fontSize + beatGridSpacing;
    
    // 6. Names & Instrument Lines Block (mandatory)
    applyTextStyle(ctx, 'namesGrid');
    const gridTopY = currentY;
    
    instruments.forEach((instrument, instIndex) => {
        // Instrument name with proper styling
        applyTextStyle(ctx, 'namesGrid');
        const nameX = getAlignmentX('namesGrid', pageLeftX, nameColumnWidth);
        ctx.fillText(instrument.name, nameX, currentY + (rowHeight / 2));
        
        // Pattern grid
        for (let bar = 0; bar < totalBars; bar++) {
            const subdivision = instrument.subdivision || defaultSubdivision;
            
            for (let beat = 0; beat < beatsPerBar; beat++) {
                for (let sub = 0; sub < subdivision; sub++) {
                    const stepIndex = (bar * beatsPerBar * subdivision) + (beat * subdivision) + sub;
                    const stepValue = instrument.pattern[stepIndex];
                    
                    const x = gridStartX + (stepIndex * stepSize) + (Math.floor(stepIndex / subdivision) * beatGap);
                    const y = currentY;
                    
                    // Step background
                    ctx.fillStyle = stepValue ? '#f8f9fa' : '#ffffff';
                    ctx.fillRect(x, y, stepSize - 2, rowHeight - 10);
                    
                    // Step borders with proper beat line emphasis
                    const isFirstSubOfBeat = sub === 0;
                    
                    ctx.lineCap = 'butt';
                    ctx.lineJoin = 'miter';
                    
                    // Regular cell border
                    ctx.strokeStyle = '#dddddd';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x, y, stepSize - 2, rowHeight - 10);
                    
                    // Bold left border for first subdivision of each beat
                    if (isFirstSubOfBeat) {
                        ctx.strokeStyle = '#333333';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(x, y + rowHeight - 10);
                        ctx.stroke();
                    }
                    
                    // Step content
                    if (stepValue) {
                        ctx.fillStyle = '#000000';
                        ctx.font = `${exportStyles.namesGrid.fontSize - 2}px ${exportStyles.namesGrid.fontFamily}`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(stepValue, x + (stepSize / 2) - 1, y + (rowHeight / 2) - 5);
                    }
                }
            }
            
            // Draw right bar line (thick)
            const barEndX = gridStartX + ((bar + 1) * beatsPerBar * subdivision * stepSize) + (bar * beatsPerBar * beatGap) + ((beatsPerBar - 1) * beatGap);
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(barEndX, currentY);
            ctx.lineTo(barEndX, currentY + rowHeight - 10);
            ctx.stroke();
        }
        
        currentY += rowHeight + 20;
    });
}