/* ========================================== */
/*            TROMKLUB RENDERER MODULE        */
/*       Canvas Rendering & Export Engine    */
/* ========================================== */

// ==========================================
//         LAYOUT & CONFIGURATION  
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

export const GRID_CONFIG = LAYOUT.grid;

export const exportStyles = {
    classic: {
        background: '#ffffff',
        text: '#000000',
        grid: '#cccccc',
        accent: '#666666',
        stepBorder: '#999999',
        stepActive: '#000000',
        beatMarker: '#333333'
    },
    modern: {
        background: '#ffffff',
        text: '#2c3e50',
        grid: '#bdc3c7',
        accent: '#3498db',
        stepBorder: '#95a5a6',
        stepActive: '#2c3e50',
        beatMarker: '#34495e'
    },
    minimal: {
        background: '#ffffff',
        text: '#333333',
        grid: '#e0e0e0',
        accent: '#666666',
        stepBorder: '#cccccc',
        stepActive: '#000000',
        beatMarker: '#555555'
    },
    mono: {
        background: '#ffffff',
        text: '#000000',
        grid: '#000000',
        accent: '#000000',
        stepBorder: '#000000',
        stepActive: '#000000',
        beatMarker: '#000000'
    }
};

export const themePresets = {
    'classic-engraved': {
        name: 'Classic Engraved',
        style: exportStyles.classic,
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
        style: exportStyles.modern,
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
        style: exportStyles.classic,
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

const PAGE_SIZES = {
    'A4': { width: 794, height: 1123 },
    'A3': { width: 1123, height: 1587 },
    'Letter': { width: 816, height: 1056 },
    'Legal': { width: 816, height: 1344 }
};

// ==========================================
//         CANVAS RENDERER CLASS
// ==========================================

export class CanvasRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.scale = 1;
        this.setupHighQuality();
    }
    
    setupHighQuality() {
        // Enable high quality rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        this.ctx.textBaseline = 'top';
        this.ctx.textAlign = 'left';
    }
    
    setScale(scale) {
        this.scale = scale;
        this.canvas.width = LAYOUT.page.width * scale;
        this.canvas.height = LAYOUT.page.height * scale;
        this.ctx.scale(scale, scale);
        this.setupHighQuality();
    }
    
    clear(color = '#ffffff') {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, LAYOUT.page.width, LAYOUT.page.height);
    }
    
    setFont(fontConfig) {
        const { family, size, weight, style } = fontConfig;
        this.ctx.font = `${style} ${weight} ${size}px ${family}`;
    }
    
    drawText(text, x, y, options = {}) {
        const { color = '#000000', align = 'left', baseline = 'top' } = options;
        
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;
        this.ctx.fillText(text, x, y);
    }
    
    drawLine(x1, y1, x2, y2, options = {}) {
        const { color = '#000000', width = 1, dash = [] } = options;
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.setLineDash(dash);
        
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
    }
    
    drawRect(x, y, width, height, options = {}) {
        const { fill = null, stroke = null, lineWidth = 1 } = options;
        
        if (fill) {
            this.ctx.fillStyle = fill;
            this.ctx.fillRect(x, y, width, height);
        }
        
        if (stroke) {
            this.ctx.strokeStyle = stroke;
            this.ctx.lineWidth = lineWidth;
            this.ctx.strokeRect(x, y, width, height);
        }
    }
}

// ==========================================
//         MAIN MUSIC RENDERER CLASS
// ==========================================

export class MusicRenderer {
    constructor(canvas) {
        this.renderer = new CanvasRenderer(canvas);
        this.currentTheme = 'classic-engraved';
        this.exportState = {
            scope: 'section',
            show: {
                instrumentNames: true,
                barNumbers: true,
                beatNumbers: true
            }
        };
    }
    
    setTheme(themeName) {
        if (themePresets[themeName]) {
            this.currentTheme = themeName;
            Object.assign(LAYOUT.fonts, themePresets[themeName].fonts);
            return true;
        }
        return false;
    }
    
    getThemeStyle() {
        return themePresets[this.currentTheme]?.style || exportStyles.classic;
    }
    
    renderSection(section, instruments, options = {}) {
        const {
            startY = LAYOUT.page.margin + 60,
            showTitle = true,
            rowModels = {}
        } = options;
        
        return renderSectionAtPosition(
            this.renderer.ctx,
            section,
            instruments,
            startY,
            showTitle,
            rowModels,
            this.exportState
        );
    }
}

// ==========================================
//      CORE RENDERING FUNCTIONS
// ==========================================

export function renderSectionAtPosition(ctx, section, instruments, startY, showTitle, rowModels, exportState) {
    try {
        const totalBars = section.bars || 4;
        const beatsPerBar = section.beats || 4;
        const subdivision = section.subdivision || 4;
        
        let cursorY = startY;
        
        // Render section title
        if ((exportState.show.barNumbers || exportState.scope === 'song') && showTitle) {
            ctx.fillStyle = '#000000';
            const font = LAYOUT.fonts.title;
            ctx.font = `${font.style} ${font.weight} ${font.size}px ${font.family}`;
            ctx.textAlign = 'center';
            ctx.fillText(section.name, LAYOUT.page.width / 2, cursorY);
            cursorY += font.size + 16;
        }
        
        // Calculate grid layout
        const gridStartX = LAYOUT.grid.pageLeftX + LAYOUT.grid.nameCol + LAYOUT.grid.beatGap;
        const stepWidth = LAYOUT.grid.stepW;
        const rowHeight = 60;
        
        // Helper functions
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
            
            // Determine bars per line
            while (endBar < totalBars && shouldAddBarToLine(section, endBar - 1, endBar, barsInCurrentLine)) {
                endBar++;
                barsInCurrentLine++;
            }
            
            // Render this line
            cursorY = renderSystemLine(ctx, section, instruments, startBar, endBar, cursorY, {
                gridStartX, stepWidth, rowHeight, stepLeftX, beatEndX, beatCenterX, barEndX
            }, rowModels, exportState);
            
            cursorY += LAYOUT.grid.systemSpacing;
            currentBarIndex = endBar;
        }
        
        return cursorY;
    } catch (error) {
        console.error('Error rendering section:', error);
        return startY;
    }
}

export function shouldAddBarToLine(section, currentBar, nextBar, currentBarCount) {
    // Check for explicit breaks
    if (section.breaks) {
        for (const brk of section.breaks) {
            if (brk.barIndex === currentBar && (brk.type === 'line' || brk.type === 'page')) {
                return false;
            }
        }
    }
    
    // Check bars per line constraints
    if (LAYOUT.grid.barsPerLineMax > 0 && currentBarCount >= LAYOUT.grid.barsPerLineMax) {
        return false;
    }
    
    return true;
}

export function renderSystemLine(ctx, section, instruments, startBar, endBar, startY, helpers, rowModels, exportState) {
    const beatsPerBar = section.beats || 4;
    const subdivision = section.subdivision || 4;
    let cursorY = startY;
    
    // Render beat numbers if enabled
    if (exportState.show.beatNumbers) {
        cursorY += LAYOUT.grid.labelOffsetBeats;
        ctx.fillStyle = '#888888';
        const font = LAYOUT.fonts.beatLabel;
        ctx.font = `${font.style} ${font.weight} ${font.size}px ${font.family}`;
        ctx.textAlign = 'center';
        
        for (let barIndex = startBar; barIndex < endBar; barIndex++) {
            for (let beatIndex = 0; beatIndex < beatsPerBar; beatIndex++) {
                const globalBeatIndex = barIndex * beatsPerBar + beatIndex;
                const x = helpers.beatCenterX(globalBeatIndex);
                ctx.fillText((beatIndex + 1).toString(), x, cursorY);
            }
        }
        
        cursorY += font.size + 8;
    }
    
    // Render bar numbers if enabled  
    if (exportState.show.barNumbers) {
        cursorY += LAYOUT.grid.labelOffsetBars;
        ctx.fillStyle = '#666666';
        const font = LAYOUT.fonts.barLabel;
        ctx.font = `${font.style} ${font.weight} ${font.size}px ${font.family}`;
        ctx.textAlign = 'center';
        
        for (let barIndex = startBar; barIndex < endBar; barIndex++) {
            const x = helpers.barEndX(barIndex) - (helpers.barEndX(barIndex) - helpers.stepLeftX(barIndex * beatsPerBar * subdivision)) / 2;
            ctx.fillText(`${barIndex + 1}`, x, cursorY);
        }
        
        cursorY += font.size + 12;
    }
    
    // Render instruments
    const visibleInstruments = instruments.filter(inst => 
        !exportState.selectedInstruments || 
        exportState.selectedInstruments.size === 0 || 
        exportState.selectedInstruments.has(inst.id)
    );
    
    for (const instrument of visibleInstruments) {
        cursorY = renderInstrumentRow(ctx, section, instrument, startBar, endBar, cursorY, helpers, rowModels, exportState);
    }
    
    return cursorY;
}

function renderInstrumentRow(ctx, section, instrument, startBar, endBar, startY, helpers, rowModels, exportState) {
    const beatsPerBar = section.beats || 4;
    const subdivision = section.subdivision || 4;
    const rowHeight = helpers.rowHeight;
    
    let cursorY = startY;
    
    // Render instrument name if enabled
    if (exportState.show.instrumentNames) {
        ctx.fillStyle = '#000000';
        const font = LAYOUT.fonts.instrumentName;
        ctx.font = `${font.style} ${font.weight} ${font.size}px ${font.family}`;
        ctx.textAlign = 'left';
        ctx.fillText(instrument.name, LAYOUT.grid.pageLeftX, cursorY + rowHeight / 2 - font.size / 2);
    }
    
    // Render steps for this instrument
    for (let barIndex = startBar; barIndex < endBar; barIndex++) {
        for (let beatIndex = 0; beatIndex < beatsPerBar; beatIndex++) {
            const globalBeatIndex = barIndex * beatsPerBar + beatIndex;
            
            for (let subdivIndex = 0; subdivIndex < subdivision; subdivIndex++) {
                const globalStepIndex = globalBeatIndex * subdivision + subdivIndex;
                const stepKey = `${barIndex}-${beatIndex}-${subdivIndex}`;
                const step = instrument.steps[stepKey];
                
                const stepX = helpers.stepLeftX(globalStepIndex);
                const stepY = cursorY + (rowHeight - 30) / 2;
                const stepWidth = helpers.stepWidth || LAYOUT.grid.stepW;
                const stepHeight = 30;
                
                // Draw step background
                ctx.fillStyle = step ? '#f0f0f0' : '#ffffff';
                ctx.fillRect(stepX, stepY, stepWidth, stepHeight);
                
                // Draw step border
                ctx.strokeStyle = (subdivIndex === 0) ? '#4ecdc4' : '#cccccc';
                ctx.lineWidth = (subdivIndex === 0) ? 2 : 1;
                ctx.strokeRect(stepX, stepY, stepWidth, stepHeight);
                
                // Draw step content
                if (step && step.symbol) {
                    ctx.fillStyle = '#000000';
                    const font = LAYOUT.fonts.stepContent;
                    ctx.font = `${font.style} ${font.weight} ${font.size}px ${font.family}`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(step.symbol, stepX + stepWidth / 2, stepY + stepHeight / 2);
                    
                    // Render modifiers if present
                    if (step.modifiers) {
                        renderStepModifiers(ctx, step.modifiers, stepX, stepY, stepWidth, stepHeight);
                    }
                }
            }
        }
    }
    
    return cursorY + rowHeight + 8;
}

function renderStepModifiers(ctx, modifiers, stepX, stepY, stepWidth, stepHeight) {
    const superScript = modifiers.super;
    const subScript = modifiers.sub;
    
    if (superScript) {
        ctx.fillStyle = '#ffc107';
        ctx.font = '7px Arial';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText(superScript, stepX + stepWidth - 2, stepY + 2);
    }
    
    if (subScript) {
        ctx.fillStyle = '#ff6b6b';
        ctx.font = '7px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(subScript, stepX + 2, stepY + stepHeight - 2);
    }
}

// ==========================================
//         EXPORT FUNCTIONS
// ==========================================

export async function exportToPDF(sections, filename = 'tromklub-score', options = {}) {
    try {
        // Dynamic import of jsPDF
        if (typeof window.jsPDF === 'undefined') {
            throw new Error('jsPDF library not loaded');
        }
        
        const { jsPDF } = window;
        const pdf = new jsPDF({
            orientation: options.orientation || 'portrait',
            unit: 'pt',
            format: options.pageSize || 'a4'
        });
        
        // Create temporary canvas for rendering
        const canvas = document.createElement('canvas');
        const renderer = new MusicRenderer(canvas);
        renderer.renderer.setScale(4); // High resolution
        
        let isFirstPage = true;
        
        for (const [sectionId, section] of Object.entries(sections)) {
            if (!isFirstPage) {
                pdf.addPage();
            }
            
            // Render section to canvas
            renderer.renderer.clear('#ffffff');
            renderer.renderSection(section, section.instruments || []);
            
            // Convert canvas to image and add to PDF
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 0, 0, LAYOUT.page.width, LAYOUT.page.height);
            
            isFirstPage = false;
        }
        
        pdf.save(`${filename}.pdf`);
        return true;
    } catch (error) {
        console.error('Error exporting PDF:', error);
        return false;
    }
}

export async function exportToPNG(canvas, filename = 'tromklub-score', options = {}) {
    try {
        const quality = options.quality || 1.0;
        const scale = options.scale || 4; // High resolution
        
        // Create high-resolution canvas
        const exportCanvas = document.createElement('canvas');
        const renderer = new CanvasRenderer(exportCanvas);
        renderer.setScale(scale);
        
        // Copy content from original canvas
        renderer.ctx.drawImage(canvas, 0, 0);
        
        // Export as PNG
        exportCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/png', quality);
        
        return true;
    } catch (error) {
        console.error('Error exporting PNG:', error);
        return false;
    }
}

export async function exportToJPEG(canvas, filename = 'tromklub-score', options = {}) {
    try {
        const quality = options.quality || 0.9;
        const scale = options.scale || 4;
        
        const exportCanvas = document.createElement('canvas');
        const renderer = new CanvasRenderer(exportCanvas);
        renderer.setScale(scale);
        
        // Fill with white background for JPEG
        renderer.clear('#ffffff');
        renderer.ctx.drawImage(canvas, 0, 0);
        
        exportCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/jpeg', quality);
        
        return true;
    } catch (error) {
        console.error('Error exporting JPEG:', error);
        return false;
    }
}

export async function exportToSVG(sections, filename = 'tromklub-score', options = {}) {
    try {
        let svgContent = `
            <svg width="${LAYOUT.page.width}" height="${LAYOUT.page.height}" 
                 xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="white"/>
        `;
        
        // This is a simplified SVG export - full implementation would require
        // converting all canvas operations to SVG elements
        svgContent += `
                <text x="${LAYOUT.page.width/2}" y="50" text-anchor="middle" 
                      font-family="Arial" font-size="16" font-weight="bold">
                    ${Object.keys(sections)[0] || 'TROMKLUB Score'}
                </text>
            </svg>
        `;
        
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return true;
    } catch (error) {
        console.error('Error exporting SVG:', error);
        return false;
    }
}

// ==========================================
//         UTILITY FUNCTIONS
// ==========================================

export function updatePageSize(size) {
    if (PAGE_SIZES[size]) {
        LAYOUT.page.width = PAGE_SIZES[size].width;
        LAYOUT.page.height = PAGE_SIZES[size].height;
        return true;
    }
    return false;
}

export function calculateCanvasSize(sections, options = {}) {
    const scale = options.scale || 1;
    const estimatedHeight = Object.keys(sections).length * LAYOUT.page.height;
    
    return {
        width: LAYOUT.page.width * scale,
        height: Math.min(estimatedHeight * scale, 32767) // Canvas size limit
    };
}

export function createPreviewCanvas(container) {
    const canvas = document.createElement('canvas');
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    canvas.style.border = 'none';
    canvas.style.borderRadius = '8px';
    canvas.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
    
    if (container) {
        container.appendChild(canvas);
    }
    
    return canvas;
}

// ==========================================
//         MODULE INITIALIZATION
// ==========================================

// ==========================================
//           EXPORTS TO WINDOW
// ==========================================

export function attachToWindow() {
    // Attach renderer functions to window for backward compatibility
    Object.assign(window, {
        MusicRenderer,
        CanvasRenderer,
        renderSectionAtPosition,
        renderSystemLine,
        exportToPDF,
        exportToPNG,
        exportToJPEG,
        exportToSVG,
        themePresets,
        exportStyles,
        
        // Export formats
        renderExportPreview: renderExportPreview,
        generateExportData: generateExportData,
        
        // Canvas utilities
        createExportCanvas,
        
        // Layout utilities  
        generateGridLayout
    });
}

// Make critical functions available immediately
if (typeof window !== 'undefined') {
    window.MusicRenderer = MusicRenderer;
    window.CanvasRenderer = CanvasRenderer;
    window.renderSectionAtPosition = renderSectionAtPosition;
    window.renderSystemLine = renderSystemLine;
    window.shouldAddBarToLine = shouldAddBarToLine;
    window.exportToPDF = exportToPDF;
    window.exportToPNG = exportToPNG;
    window.exportToJPEG = exportToJPEG;
    window.exportToSVG = exportToSVG;
    window.themePresets = themePresets;
    window.exportStyles = exportStyles;
    window.updatePageSize = updatePageSize;
    window.calculateCanvasSize = calculateCanvasSize;
    window.createPreviewCanvas = createPreviewCanvas;
    
    // Call existing attach function
    attachToWindow();
}

// Default export
export default MusicRenderer;

console.log('TROMKLUB Renderer module loaded successfully');