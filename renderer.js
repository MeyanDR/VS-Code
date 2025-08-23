/**
 * Renderer.js - Professional Music Notation Rendering Engine
 * 
 * This module contains all rendering functionality for the drum notation application:
 * - Canvas rendering & export engine
 * - PDF, PNG, JPEG, SVG export capabilities  
 * - Professional music notation rendering
 * - Theme & style management
 * - Canvas utilities and helpers
 * 
 * Extracted and optimized from index.html
 */

// ==========================================
// LAYOUT & CONFIGURATION CONSTANTS
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
        
        // Page layout
        pageLeftX: 40,
        pageRightX: 40,
        
        // Line configuration
        barsPerLineMin: 1,
        barsPerLineMax: 4,
        
        // Visual styling
        strokeThin: 0.5,
        strokeBeat: 1,
        strokeBar: 2,
        thinLineColor: '#ddd',
        thickLineColor: '#999',
        
        // Labels
        labelOffsetBeats: 15,
        labelOffsetBars: 0,
        
        // Row dimensions
        rowHeight: 40,
        
        // Grid config compatibility
        stepSize: 35,
        stepBackgroundActive: '#f0f8ff',
        stepBackgroundInactive: '#ffffff',
        nameColumnWidth: 110,
        nameGap: 10,
        blockSpacing: 12,
        barHeaderBeatSpacing: 8,
        beatGridSpacing: 12,
        barLineWidth: 2,
        thickLineWidth: 1,
        thinLineWidth: 0.5
    },
    
    page: {
        width: 794,  // A4 width at 96 DPI
        height: 1123, // A4 height at 96 DPI
        orientation: 'portrait'
    },
    
    fonts: {
        title: {
            family: 'Times New Roman',
            size: 18,
            weight: 'bold',
            style: 'normal'
        },
        instrumentName: {
            family: 'Times New Roman', 
            size: 12,
            weight: 'normal',
            style: 'normal'
        },
        beatLabel: {
            family: 'Times New Roman',
            size: 10,
            weight: 'normal', 
            style: 'normal'
        },
        barNumber: {
            family: 'Times New Roman',
            size: 12,
            weight: 'bold',
            style: 'normal'
        }
    }
};

// Grid config compatibility alias
export const GRID_CONFIG = LAYOUT.grid;

// ==========================================
// EXPORT STYLES & THEMES
// ==========================================

export let exportStyles = {
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

export const themePresets = {
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
        namesGrid: { fontFamily: 'Courier New', fontSize: 12, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left' }
    }
};

// ==========================================
// CANVAS UTILITIES & HELPERS
// ==========================================

export class CanvasRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas?.getContext('2d');
        this.scaleFactor = 1;
    }
    
    setHighQuality(scaleFactor = 4) {
        if (!this.ctx) return;
        this.scaleFactor = scaleFactor;
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        this.ctx.scale(scaleFactor, scaleFactor);
    }
    
    clear(fillColor = '#ffffff') {
        if (!this.ctx || !this.canvas) return;
        this.ctx.fillStyle = fillColor;
        this.ctx.fillRect(0, 0, this.canvas.width / this.scaleFactor, this.canvas.height / this.scaleFactor);
    }
    
    applyTextStyle(blockType) {
        if (!this.ctx) return;
        const style = exportStyles[blockType];
        if (!style) return;
        
        const weight = style.fontWeight === 'bold' ? 'bold' : 'normal';
        const styleStr = style.fontStyle === 'italic' ? 'italic' : 'normal';
        
        this.ctx.font = `${styleStr} ${weight} ${style.fontSize}px ${style.fontFamily}`;
        this.ctx.fillStyle = '#000000';
        this.ctx.textAlign = style.textAlign;
        this.ctx.textBaseline = 'top';
    }
    
    getAlignmentX(blockType, columnLeft, columnWidth) {
        const align = exportStyles[blockType]?.textAlign || 'left';
        switch (align) {
            case 'center': return columnLeft + columnWidth / 2;
            case 'right': return columnLeft + columnWidth;
            default: return columnLeft;
        }
    }
}

// ==========================================
// GRID LAYOUT GENERATOR
// ==========================================

export function generateGridLayout(section, canvasWidth) {
    if (!section) return { instruments: [], totalBars: 0 };
    
    const instruments = section.data?.filter(inst => inst.visible !== false) || [];
    const totalBars = section.bars || 4;
    const beatsPerBar = section.beats || 4;
    const defaultSubdivision = section.subdivision || 4;
    
    const pageWidth = canvasWidth - (GRID_CONFIG.pageLeftX + GRID_CONFIG.pageRightX);
    const textColumnWidth = pageWidth - 2 * GRID_CONFIG.pageLeftX;
    const gridStartX = GRID_CONFIG.pageLeftX + GRID_CONFIG.nameColumnWidth + GRID_CONFIG.nameGap;
    
    // Calculate step positions including beatGap
    function stepLeftX(stepIndex) {
        const beatIndex = Math.floor(stepIndex / defaultSubdivision);
        return gridStartX + (stepIndex * LAYOUT.grid.stepW) + (beatIndex * LAYOUT.grid.beatGap);
    }
    
    function beatEndX(beatIndex) {
        const stepIndex = (beatIndex + 1) * defaultSubdivision - 1;
        return stepLeftX(stepIndex) + LAYOUT.grid.stepW;
    }
    
    function beatCenterX(beatIndex) {
        const startStep = beatIndex * defaultSubdivision;
        const endStep = startStep + defaultSubdivision - 1;
        return (stepLeftX(startStep) + stepLeftX(endStep) + LAYOUT.grid.stepW) / 2;
    }
    
    function barEndX(barIndex) {
        const beatIndex = (barIndex + 1) * beatsPerBar - 1;
        return beatEndX(beatIndex);
    }
    
    return {
        instruments,
        totalBars,
        beatsPerBar,
        defaultSubdivision,
        textColumnWidth,
        gridStartX,
        stepLeftX,
        beatEndX,
        beatCenterX,
        barEndX
    };
}

// ==========================================
// CORE RENDERING FUNCTIONS
// ==========================================

export function renderEmptySheet(ctx, canvas) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add empty sheet message
    ctx.fillStyle = '#666666';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('No data to display', canvas.width / 2, canvas.height / 2);
}

export function renderStepSymbol(ctx, stepValue, x, y, width) {
    // Parse step value (e.g., "x|a" for accent)
    const parts = stepValue.split('|');
    const symbol = parts[0] || 'o';
    const modifier = parts[1] || '';
    
    ctx.fillStyle = '#000000';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    
    // Render main symbol
    switch (symbol) {
        case 'x':
            ctx.fillText('×', x + width/2, y + 5);
            break;
        case 'o':
            ctx.fillText('○', x + width/2, y + 5);
            break;
        case '+':
            ctx.fillText('+', x + width/2, y + 5);
            break;
        default:
            ctx.fillText(symbol, x + width/2, y + 5);
    }
    
    // Render modifier if present
    if (modifier) {
        ctx.font = '10px Arial';
        ctx.fillText(modifier, x + width/2, y + 18);
    }
}

export function renderSystemLine(ctx, section, instruments, startBar, endBar, startY, helpers, rowModels) {
    const beatsPerBar = section.beats || 4;
    const subdivision = section.subdivision || 4;
    let cursorY = startY;
    
    // Render beat numbers if enabled
    if (window.exportState?.show.beatNumbers) {
        cursorY += LAYOUT.grid.labelOffsetBeats;
        ctx.fillStyle = '#888888';
        const font = LAYOUT.fonts.beatLabel;
        ctx.font = `${font.style} ${font.weight} ${font.size}px ${font.family}`;
        ctx.textAlign = 'center';
        
        for (let bar = startBar; bar < endBar; bar++) {
            for (let beat = 0; beat < beatsPerBar; beat++) {
                const beatX = helpers.beatCenterX(bar * beatsPerBar + beat);
                const label = window.exportState?.show.subdivisionNumbers ? 
                    `${bar + 1}.${beat + 1}` : `${beat + 1}`;
                ctx.fillText(label, beatX, cursorY);
            }
        }
        cursorY += 8;
    }
    
    // Render bar numbers if enabled
    if (window.exportState?.show.barNumbers) {
        ctx.fillStyle = '#666666';
        const font = LAYOUT.fonts.barNumber;
        ctx.font = `${font.style} ${font.weight} ${font.size}px ${font.family}`;
        ctx.textAlign = 'center';
        
        for (let bar = startBar; bar < endBar; bar++) {
            const barCenterX = (helpers.stepLeftX(bar * beatsPerBar * subdivision) + 
                             helpers.barEndX(bar)) / 2;
            ctx.fillText(`Bar ${bar + 1}`, barCenterX + LAYOUT.grid.labelOffsetBars, cursorY);
        }
        cursorY += 16;
    }
    
    const gridTopY = cursorY;
    
    // Render grid lines first (thin lines)
    ctx.strokeStyle = LAYOUT.grid.thinLineColor;
    ctx.lineWidth = LAYOUT.grid.strokeThin;
    
    for (let bar = startBar; bar < endBar; bar++) {
        for (let beat = 0; beat < beatsPerBar; beat++) {
            for (let step = 0; step < subdivision; step++) {
                const stepIndex = bar * beatsPerBar * subdivision + beat * subdivision + step;
                const x = helpers.stepLeftX(stepIndex);
                
                ctx.beginPath();
                ctx.moveTo(x + 0.5, gridTopY);
                ctx.lineTo(x + 0.5, gridTopY + instruments.length * 60);
                ctx.stroke();
            }
        }
    }
    
    // Render beat lines (thick lines)
    ctx.lineWidth = LAYOUT.grid.strokeBeat;
    ctx.strokeStyle = LAYOUT.grid.thickLineColor;
    
    for (let bar = startBar; bar < endBar; bar++) {
        for (let beat = 0; beat < beatsPerBar; beat++) {
            const stepIndex = bar * beatsPerBar * subdivision + beat * subdivision;
            const x = helpers.stepLeftX(stepIndex);
            
            ctx.beginPath();
            ctx.moveTo(x + 0.5, gridTopY);
            ctx.lineTo(x + 0.5, gridTopY + instruments.length * 60);
            ctx.stroke();
        }
    }
    
    // Render bar end lines (thickest lines)
    ctx.lineWidth = LAYOUT.grid.strokeBar;
    
    for (let bar = startBar; bar < endBar; bar++) {
        const x = helpers.barEndX(bar);
        
        ctx.beginPath();
        ctx.moveTo(x + 0.5, gridTopY);
        ctx.lineTo(x + 0.5, gridTopY + instruments.length * 60);
        ctx.stroke();
    }
    
    // Render instruments using row models if available
    cursorY = gridTopY;
    instruments.forEach((instrument, instIndex) => {
        // Instrument name
        ctx.fillStyle = '#000000';
        const font = LAYOUT.fonts.instrumentName;
        ctx.font = `${font.style} ${font.weight} ${font.size}px ${font.family}`;
        ctx.textAlign = 'right';
        ctx.fillText(instrument.name, helpers.gridStartX - 10, cursorY + 30);
        
        // Render instrument steps - use row model if available for per-instrument metrics
        const rowModel = rowModels && rowModels[instIndex] ? rowModels[instIndex] : null;
        if (rowModel) {
            renderInstrumentStepsWithRowModel(ctx, rowModel, startBar, endBar, cursorY);
        } else {
            renderInstrumentSteps(ctx, instrument, section, startBar, endBar, cursorY, helpers);
        }
        
        cursorY += 60;
    });
    
    return cursorY;
}

export function renderInstrumentSteps(ctx, instrument, section, startBar, endBar, y, helpers) {
    const beatsPerBar = section.beats || 4;
    const subdivision = section.subdivision || 4;
    
    for (let bar = startBar; bar < endBar; bar++) {
        for (let beat = 0; beat < beatsPerBar; beat++) {
            for (let step = 0; step < subdivision; step++) {
                const globalStepIndex = bar * beatsPerBar * subdivision + beat * subdivision + step;
                const stepValue = instrument.steps[globalStepIndex];
                
                if (stepValue) {
                    const x = helpers.stepLeftX(globalStepIndex);
                    renderStepSymbol(ctx, stepValue, x, y + 30, LAYOUT.grid.stepW);
                }
            }
        }
    }
}

export function renderInstrumentStepsWithRowModel(ctx, rowModel, startBar, endBar, y) {
    const instrument = rowModel.instrument;
    
    // Only render bars that are within the instrument's range
    const maxBar = Math.min(endBar, rowModel.bars);
    
    for (let bar = startBar; bar < maxBar; bar++) {
        for (let beat = 0; beat < rowModel.beats; beat++) {
            for (let step = 0; step < rowModel.subdivision; step++) {
                const globalStepIndex = bar * rowModel.beats * rowModel.subdivision + beat * rowModel.subdivision + step;
                
                // Check if step exists in instrument data
                if (globalStepIndex < instrument.steps.length) {
                    const stepValue = instrument.steps[globalStepIndex];
                    
                    if (stepValue) {
                        const x = rowModel.stepLeftX(globalStepIndex);
                        renderStepSymbol(ctx, stepValue, x, y + 30, rowModel.stepWidth);
                    }
                }
            }
        }
    }
}

// ==========================================
// SECTION & SONG RENDERING
// ==========================================

export function renderSectionAtPosition(ctx, section, width, startY) {
    if (!section || !section.data) return startY;
    
    const instruments = section.data.filter(inst => inst.visible !== false) || [];
    if (instruments.length === 0) return startY;
    
    // Build row models for each instrument (per-instrument metrics)
    const rowModels = buildRowModels ? buildRowModels(section, instruments) : null;
    
    const totalBars = section.bars || 4;
    const beatsPerBar = section.beats || 4;
    const subdivision = section.subdivision || 4;
    
    let cursorY = startY;
    
    // Render section title using LAYOUT.fonts
    if (window.exportState?.show.barNumbers || window.exportState?.scope === 'song') {
        ctx.fillStyle = '#000000';
        const font = LAYOUT.fonts.title;
        ctx.font = `${font.style} ${font.weight} ${font.size}px ${font.family}`;
        ctx.textAlign = 'center';
        ctx.fillText(section.name, width / 2, cursorY);
        cursorY += font.size + 16;
    }
    
    // Calculate grid layout with new LAYOUT values
    const gridStartX = LAYOUT.grid.pageLeftX + LAYOUT.grid.nameCol + LAYOUT.grid.beatGap;
    const stepWidth = LAYOUT.grid.stepW;
    const rowHeight = 60; // Could be made configurable
    
    // Helper functions using new LAYOUT
    function stepLeftX(stepIndex) {
        const beatIndex = Math.floor(stepIndex / subdivision);
        return gridStartX + (stepIndex * stepWidth) + (beatIndex * LAYOUT.grid.beatGap);
    }
    
    function beatEndX(beatIndex) {
        const stepIndex = (beatIndex + 1) * subdivision - 1;
        return stepLeftX(stepIndex) + stepWidth;
    }
    
    function beatCenterX(beatIndex) {
        const startStep = beatIndex * subdivision;
        const endStep = startStep + subdivision - 1;
        return (stepLeftX(startStep) + stepLeftX(endStep) + stepWidth) / 2;
    }
    
    function barEndX(barIndex) {
        const beatIndex = (barIndex + 1) * beatsPerBar - 1;
        return beatEndX(beatIndex);
    }
    
    // Apply bars per line constraints
    let barsInCurrentLine = 0;
    let currentBarIndex = 0;
    
    while (currentBarIndex < totalBars) {
        const startBar = currentBarIndex;
        let endBar = currentBarIndex + 1;
        barsInCurrentLine = 1;
        
        // Determine how many bars to put on this line
        while (endBar < totalBars && shouldAddBarToLine(section, endBar - 1, endBar, barsInCurrentLine)) {
            endBar++;
            barsInCurrentLine++;
        }
        
        // Render this line
        cursorY = renderSystemLine(ctx, section, instruments, startBar, endBar, cursorY, {
            gridStartX, stepWidth, rowHeight, stepLeftX, beatEndX, beatCenterX, barEndX
        }, rowModels);
        
        cursorY += LAYOUT.grid.systemSpacing; // System spacing between lines
        currentBarIndex = endBar;
    }
    
    return cursorY;
}

export function shouldAddBarToLine(section, currentBar, nextBar, currentBarCount) {
    // Check for explicit breaks
    if (section.breaks) {
        for (const brk of section.breaks) {
            if (brk.barIndex === currentBar && brk.type === 'line') {
                return false; // Force line break here
            }
            if (brk.barIndex === currentBar && brk.type === 'page') {
                return false; // Force page break here
            }
        }
    }
    
    // Check bars per line constraints
    if (LAYOUT.grid.barsPerLineMax > 0 && currentBarCount >= LAYOUT.grid.barsPerLineMax) {
        return false;
    }
    
    // Could add auto-fit logic here based on available width
    return true;
}

export function renderFullSong(ctx, width, height) {
    let cursorY = 60; // Start position
    
    if (window.project && window.project.sections) {
        window.project.sections.forEach((section, index) => {
            if (index > 0) {
                cursorY += LAYOUT.grid.systemSpacing; // Section gap between sections
            }
            
            cursorY = renderSectionAtPosition(ctx, section, width, cursorY);
        });
    }
}

export function renderSingleSection(ctx, width, height, section) {
    renderSectionAtPosition(ctx, section, width, 60);
}

// ==========================================
// SVG RENDERING SUPPORT
// ==========================================

export function createSVGContext(width, height) {
    // Simple SVG context that mimics canvas API
    const elements = [];
    let currentStyle = {
        fillStyle: '#000000',
        strokeStyle: '#000000',
        lineWidth: 1,
        font: '12px Arial',
        textAlign: 'left',
        textBaseline: 'alphabetic'
    };
    
    const context = {
        width,
        height,
        
        // Style properties
        set fillStyle(value) { currentStyle.fillStyle = value; },
        get fillStyle() { return currentStyle.fillStyle; },
        set strokeStyle(value) { currentStyle.strokeStyle = value; },
        get strokeStyle() { return currentStyle.strokeStyle; },
        set lineWidth(value) { currentStyle.lineWidth = value; },
        get lineWidth() { return currentStyle.lineWidth; },
        set font(value) { currentStyle.font = value; },
        get font() { return currentStyle.font; },
        set textAlign(value) { currentStyle.textAlign = value; },
        get textAlign() { return currentStyle.textAlign; },
        set textBaseline(value) { currentStyle.textBaseline = value; },
        get textBaseline() { return currentStyle.textBaseline; },
        
        // Drawing methods
        fillRect(x, y, w, h) {
            elements.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${currentStyle.fillStyle}"/>`);
        },
        
        fillText(text, x, y) {
            const [size, ...fontParts] = currentStyle.font.split(' ');
            const fontFamily = fontParts.join(' ').replace(/['"]/g, '');
            const fontSize = parseInt(size);
            
            let textAnchor = 'start';
            if (currentStyle.textAlign === 'center') textAnchor = 'middle';
            else if (currentStyle.textAlign === 'right') textAnchor = 'end';
            
            let dominantBaseline = 'alphabetic';
            if (currentStyle.textBaseline === 'middle') dominantBaseline = 'central';
            else if (currentStyle.textBaseline === 'top') dominantBaseline = 'text-before-edge';
            
            elements.push(`<text x="${x}" y="${y}" fill="${currentStyle.fillStyle}" font-family="${fontFamily}" font-size="${fontSize}" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}">${escapeXML(text)}</text>`);
        },
        
        measureText(text) {
            // Rough approximation for SVG
            return { width: text.length * 8 };
        },
        
        save() {},
        restore() {},
        
        beginPath() {},
        moveTo(x, y) { this.currentPath = `M ${x} ${y}`; },
        lineTo(x, y) { this.currentPath += ` L ${x} ${y}`; },
        stroke() {
            if (this.currentPath) {
                elements.push(`<path d="${this.currentPath}" stroke="${currentStyle.strokeStyle}" stroke-width="${currentStyle.lineWidth}" fill="none"/>`);
            }
        },
        
        clearRect(x, y, w, h) {
            // For SVG, we'll just add a white background
            if (x === 0 && y === 0) {
                elements.unshift(`<rect x="0" y="0" width="${width}" height="${height}" fill="white"/>`);
            }
        },
        
        toString() {
            return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
${elements.join('\n')}
</svg>`;
        }
    };
    
    return context;
}

export function renderToSVG(svgCtx, scopeData) {
    // Use the same rendering logic as canvas
    if (window.exportState?.scope === 'song') {
        renderFullSongSVG(svgCtx, LAYOUT.page.width, LAYOUT.page.height);
    } else {
        renderSingleSectionSVG(svgCtx, LAYOUT.page.width, LAYOUT.page.height, scopeData);
    }
}

export function renderFullSongSVG(svgCtx, width, height) {
    // Clear background
    svgCtx.clearRect(0, 0, width, height);
    
    let cursorY = 60;
    
    if (window.project && window.project.sections) {
        window.project.sections.forEach((section, index) => {
            if (index > 0) {
                cursorY += LAYOUT.grid.systemSpacing;
            }
            cursorY = renderSectionAtPositionSVG(svgCtx, section, width, cursorY);
        });
    }
}

export function renderSingleSectionSVG(svgCtx, width, height, section) {
    svgCtx.clearRect(0, 0, width, height);
    renderSectionAtPositionSVG(svgCtx, section, width, 60);
}

export function renderSectionAtPositionSVG(svgCtx, section, width, startY) {
    // This is essentially the same as renderSectionAtPosition but for SVG
    // We can reuse the existing logic by calling the same function
    return renderSectionAtPosition(svgCtx, section, width, startY);
}

// ==========================================
// EXPORT FUNCTIONS
// ==========================================

export async function exportToPDF(canvas, filename = 'export') {
    try {
        console.log('Starting high-quality PDF export...');
        
        // Check if jsPDF is available
        let jsPDFClass;
        if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
            jsPDFClass = window.jspdf.jsPDF;
        } else if (typeof jsPDF !== 'undefined') {
            jsPDFClass = jsPDF;
        } else if (typeof window.jsPDF !== 'undefined') {
            jsPDFClass = window.jsPDF;
        } else {
            throw new Error('jsPDF library not available');
        }
        
        if (!canvas) {
            throw new Error('Canvas not found');
        }
        
        const scaleFactor = 4; // High resolution
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = canvas.width * scaleFactor;
        exportCanvas.height = canvas.height * scaleFactor;
        
        const ctx = exportCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.scale(scaleFactor, scaleFactor);
        
        // Render high-quality content
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Re-render content at high resolution
        const renderer = new CanvasRenderer(exportCanvas);
        renderer.setHighQuality(1); // Already scaled manually
        
        // Create PDF with high-quality image
        const pdf = new jsPDFClass({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: false // Better quality
        });
        
        // Convert canvas to high-quality image
        const imgData = exportCanvas.toDataURL('image/jpeg', 0.98);
        
        // Calculate dimensions to fit A4 page
        const pageWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const margin = 15;
        const printableWidth = pageWidth - (margin * 2);
        const printableHeight = pageHeight - (margin * 2);
        
        // Calculate scaling to fit page while maintaining aspect ratio
        const canvasAspectRatio = exportCanvas.width / exportCanvas.height;
        const pageAspectRatio = printableWidth / printableHeight;
        
        let imgWidth, imgHeight;
        if (canvasAspectRatio > pageAspectRatio) {
            // Canvas is wider, scale by width
            imgWidth = printableWidth;
            imgHeight = printableWidth / canvasAspectRatio;
        } else {
            // Canvas is taller, scale by height
            imgHeight = printableHeight;
            imgWidth = printableHeight * canvasAspectRatio;
        }
        
        // Center the image on the page
        const imgX = (pageWidth - imgWidth) / 2;
        const imgY = (pageHeight - imgHeight) / 2;
        
        // Add image to PDF
        pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth, imgHeight, '', 'MEDIUM');
        
        // Save the PDF
        pdf.save(filename + '.pdf');
        
        console.log('High-quality PDF exported successfully:', filename);
        return true;
        
    } catch (error) {
        console.error('Error exporting PDF:', error);
        throw error;
    }
}

export async function exportToPNG(canvas, filename = 'export') {
    try {
        console.log('Starting high-quality PNG export...');
        
        if (!canvas) {
            throw new Error('Canvas not found');
        }
        
        const scaleFactor = 4; // 4x resolution for print quality
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = canvas.width * scaleFactor;
        exportCanvas.height = canvas.height * scaleFactor;
        
        const ctx = exportCanvas.getContext('2d');
        
        // High-quality rendering settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.scale(scaleFactor, scaleFactor);
        
        // Clear high-res canvas background
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Re-render content at high resolution
        const renderer = new CanvasRenderer(exportCanvas);
        renderer.setHighQuality(1); // Already scaled manually
        
        // Convert to high-quality PNG
        const link = document.createElement('a');
        link.download = filename + '.png';
        link.href = exportCanvas.toDataURL('image/png', 1.0);
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('High-quality PNG export completed');
        return true;
        
    } catch (error) {
        console.error('PNG export failed:', error);
        throw error;
    }
}

export async function exportToJPEG(canvas, filename = 'export', quality = 0.95) {
    try {
        console.log('Starting high-quality JPEG export...');
        
        if (!canvas) {
            throw new Error('Canvas not found');
        }
        
        const scaleFactor = 4; // 4x resolution for print quality
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = canvas.width * scaleFactor;
        exportCanvas.height = canvas.height * scaleFactor;
        
        const ctx = exportCanvas.getContext('2d');
        
        // High-quality rendering settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.scale(scaleFactor, scaleFactor);
        
        // Clear high-res canvas background
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Re-render content at high resolution
        const renderer = new CanvasRenderer(exportCanvas);
        renderer.setHighQuality(1); // Already scaled manually
        
        // Convert to high-quality JPEG
        const link = document.createElement('a');
        link.download = filename + '.jpg';
        link.href = exportCanvas.toDataURL('image/jpeg', quality);
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('High-quality JPEG export completed');
        return true;
        
    } catch (error) {
        console.error('JPEG export failed:', error);
        throw error;
    }
}

export async function exportToSVG(scopeData, filename = 'export') {
    try {
        console.log('Starting SVG export...');
        
        if (!scopeData) {
            throw new Error('No data to export');
        }
        
        // Create SVG context
        const svg = createSVGContext(LAYOUT.page.width, LAYOUT.page.height);
        
        // Render using the same logic as canvas
        renderToSVG(svg, scopeData);
        
        // Create download
        const svgBlob = new Blob([svg.toString()], { type: 'image/svg+xml' });
        const link = document.createElement('a');
        link.download = filename + '.svg';
        link.href = URL.createObjectURL(svgBlob);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('SVG export completed');
        return true;
        
    } catch (error) {
        console.error('SVG export failed:', error);
        throw error;
    }
}

// ==========================================
// THEME MANAGEMENT
// ==========================================

export function applyTheme(themeName) {
    if (!themeName || !themePresets[themeName]) return;
    
    const theme = themePresets[themeName];
    for (const blockType in theme) {
        if (exportStyles[blockType]) {
            Object.assign(exportStyles[blockType], theme[blockType]);
        }
    }
    
    return true;
}

export function updatePageSize(format, orientation) {
    const sizes = {
        'A4': { width: 794, height: 1123 },
        'A3': { width: 1123, height: 1587 },
        'Letter': { width: 816, height: 1056 },
        'Legal': { width: 816, height: 1344 }
    };
    
    const size = sizes[format] || sizes['A4'];
    
    if (orientation === 'landscape') {
        LAYOUT.page.width = size.height;
        LAYOUT.page.height = size.width;
    } else {
        LAYOUT.page.width = size.width;
        LAYOUT.page.height = size.height;
    }
    
    LAYOUT.page.orientation = orientation;
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

export function escapeXML(text) {
    return text.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');
}

// ==========================================
// MAIN RENDERER CLASS
// ==========================================

export class MusicRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas?.getContext('2d');
        this.canvasRenderer = new CanvasRenderer(canvas);
    }
    
    renderSection(section, options = {}) {
        if (!this.ctx || !section) return;
        
        const width = options.width || this.canvas.width;
        const height = options.height || this.canvas.height;
        
        // Clear canvas
        this.canvasRenderer.clear();
        
        // Render section
        renderSectionAtPosition(this.ctx, section, width, 60);
    }
    
    renderSong(project, options = {}) {
        if (!this.ctx || !project?.sections) return;
        
        const width = options.width || this.canvas.width;
        const height = options.height || this.canvas.height;
        
        // Clear canvas
        this.canvasRenderer.clear();
        
        // Render full song
        renderFullSong(this.ctx, width, height);
    }
    
    async exportPDF(filename, options = {}) {
        return exportToPDF(this.canvas, filename);
    }
    
    async exportPNG(filename, options = {}) {
        return exportToPNG(this.canvas, filename);
    }
    
    async exportJPEG(filename, options = {}) {
        return exportToJPEG(this.canvas, filename, options.quality);
    }
    
    async exportSVG(scopeData, filename, options = {}) {
        return exportToSVG(scopeData, filename);
    }
    
    applyTheme(themeName) {
        return applyTheme(themeName);
    }
}

// Default export
export default MusicRenderer;