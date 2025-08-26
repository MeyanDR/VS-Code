/**
 * Layout Configuration Module
 * Central configuration for all layout-related settings
 */

export const LAYOUT = {
    grid: {
        // Core dimensions
        stepW: 35,
        beatWidth: 140,
        beatGap: 2,
        nameCol: 110,
        rowGap: 8,
        
        // System spacing
        systemSpacing: 32,
        
        // Bars per line constraints
        barsPerLineMin: 0, // 0 means unlimited
        barsPerLineMax: 0, // 0 means unlimited
        
        // Line strokes
        strokeThin: 1,
        strokeBeat: 2,
        strokeBar: 3,
        
        // Label positioning
        labelOffsetBeats: 12,
        labelOffsetBars: 6,
        
        // Section spacing
        sectionGap: 24,
        
        // Legacy compatibility
        pageLeftX: 40,
        pageRightX: 40,
        nameColumnWidth: 110,
        nameGap: 10,
        stepSize: 30,
        rowHeight: 60,
        blockSpacing: 12,
        barHeaderBeatSpacing: 8,
        beatGridSpacing: 12,
        thinLineWidth: 1,
        thickLineWidth: 2,
        barLineWidth: 3,
        
        // Colors
        thinLineColor: '#dddddd',
        thickLineColor: '#333333',
        stepBackgroundActive: '#f8f9fa',
        stepBackgroundInactive: '#ffffff'
    },
    
    page: {
        size: 'A4',
        orientation: 'portrait',
        width: 1270,  // 794 * 1.6 for better visibility
        height: 1797  // 1123 * 1.6 for better visibility
    },
    
    fonts: {
        title: { family: 'Helvetica', size: 24, weight: 'bold', style: 'normal' },
        subtitle: { family: 'Helvetica', size: 14, weight: 'normal', style: 'normal' },
        instrumentName: { family: 'Helvetica', size: 12, weight: 'bold', style: 'normal' },
        beatLabel: { family: 'Helvetica', size: 10, weight: 'normal', style: 'normal' },
        barNumber: { family: 'Helvetica', size: 10, weight: 'bold', style: 'normal' },
        subdivisionLabel: { family: 'Helvetica', size: 8, weight: 'normal', style: 'normal' },
        legend: { family: 'Helvetica', size: 9, weight: 'normal', style: 'normal' }
    }
};

// Helper functions for layout calculations
export const LayoutHelpers = {
    /**
     * Calculate page dimensions based on size and orientation
     */
    calculatePageDimensions(size, orientation) {
        const sizes = {
            'A4': { width: 1270, height: 1797 },
            'A3': { width: 1797, height: 2539 },
            'Letter': { width: 1306, height: 1690 }
        };
        
        let dims = sizes[size] || sizes['A4'];
        if (orientation === 'landscape') {
            return { width: dims.height, height: dims.width };
        }
        return dims;
    },
    
    /**
     * Update page size in the LAYOUT configuration
     */
    updatePageSize(size, orientation) {
        const dims = this.calculatePageDimensions(size, orientation);
        LAYOUT.page.size = size;
        LAYOUT.page.orientation = orientation;
        LAYOUT.page.width = dims.width;
        LAYOUT.page.height = dims.height;
    },
    
    /**
     * Apply text scale factor to all fonts
     */
    applyTextScale(scaleFactor, baseTheme) {
        Object.keys(LAYOUT.fonts).forEach(fontKey => {
            const originalSize = baseTheme.fonts[fontKey]?.size || LAYOUT.fonts[fontKey].size;
            LAYOUT.fonts[fontKey].size = Math.round(originalSize * scaleFactor);
        });
    },
    
    /**
     * Get beat width including gap
     */
    getBeatTotalWidth() {
        return LAYOUT.grid.beatWidth + LAYOUT.grid.beatGap;
    },
    
    /**
     * Calculate bar width based on beats per bar
     */
    getBarWidth(beatsPerBar) {
        return this.getBeatTotalWidth() * beatsPerBar;
    },
    
    /**
     * Calculate total row height including gap
     */
    getRowTotalHeight() {
        return LAYOUT.grid.rowHeight + LAYOUT.grid.rowGap;
    }
};

// Maintain backwards compatibility
export const GRID_CONFIG = LAYOUT.grid;

export default LAYOUT;