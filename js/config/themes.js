/**
 * Theme Configuration Module
 * Defines all available themes for the TROMKLUB Machine
 */

export const THEMES = {
    'classic-engraved': {
        name: 'Classic Engraved',
        fonts: {
            title: { family: 'Times New Roman', size: 26, weight: 'bold', style: 'normal' },
            subtitle: { family: 'Georgia', size: 14, weight: 'normal', style: 'normal' },
            instrumentName: { family: 'Times New Roman', size: 12, weight: 'bold', style: 'normal' },
            beatLabel: { family: 'Times New Roman', size: 10, weight: 'normal', style: 'normal' },
            barNumber: { family: 'Times New Roman', size: 10, weight: 'bold', style: 'normal' },
            subdivisionLabel: { family: 'Times New Roman', size: 8, weight: 'normal', style: 'normal' },
            legend: { family: 'Times New Roman', size: 9, weight: 'normal', style: 'normal' }
        },
        grid: { 
            strokeThin: 1, 
            strokeBeat: 2, 
            strokeBar: 2 
        }
    },
    
    'modern-sans': {
        name: 'Modern Sans',
        fonts: {
            title: { family: 'Helvetica', size: 24, weight: 'bold', style: 'normal' },
            subtitle: { family: 'Arial', size: 14, weight: 'normal', style: 'normal' },
            instrumentName: { family: 'Helvetica', size: 12, weight: 'bold', style: 'normal' },
            beatLabel: { family: 'Helvetica', size: 10, weight: 'normal', style: 'normal' },
            barNumber: { family: 'Helvetica', size: 10, weight: 'bold', style: 'normal' },
            subdivisionLabel: { family: 'Helvetica', size: 8, weight: 'normal', style: 'normal' },
            legend: { family: 'Helvetica', size: 9, weight: 'normal', style: 'normal' }
        },
        grid: { 
            strokeThin: 1, 
            strokeBeat: 2, 
            strokeBar: 3 
        }
    },
    
    'jazz-lead': {
        name: 'Jazz Lead',
        fonts: {
            title: { family: 'Futura', size: 28, weight: 'bold', style: 'italic' },
            subtitle: { family: 'Arial Rounded MT Bold', size: 14, weight: 'normal', style: 'italic' },
            instrumentName: { family: 'Futura', size: 12, weight: 'bold', style: 'normal' },
            beatLabel: { family: 'Futura', size: 10, weight: 'normal', style: 'normal' },
            barNumber: { family: 'Futura', size: 10, weight: 'bold', style: 'normal' },
            subdivisionLabel: { family: 'Futura', size: 8, weight: 'normal', style: 'normal' },
            legend: { family: 'Futura', size: 9, weight: 'normal', style: 'normal' }
        },
        grid: { 
            strokeThin: 1, 
            strokeBeat: 2, 
            strokeBar: 2 
        }
    },
    
    'minimal-mono': {
        name: 'Minimal Mono',
        fonts: {
            title: { family: 'Courier New', size: 22, weight: 'bold', style: 'normal' },
            subtitle: { family: 'Courier New', size: 12, weight: 'normal', style: 'normal' },
            instrumentName: { family: 'Courier New', size: 11, weight: 'bold', style: 'normal' },
            beatLabel: { family: 'Courier New', size: 9, weight: 'normal', style: 'normal' },
            barNumber: { family: 'Courier New', size: 9, weight: 'bold', style: 'normal' },
            subdivisionLabel: { family: 'Courier New', size: 8, weight: 'normal', style: 'normal' },
            legend: { family: 'Courier New', size: 8, weight: 'normal', style: 'normal' }
        },
        grid: { 
            strokeThin: 0.75, 
            strokeBeat: 2, 
            strokeBar: 2 
        }
    },
    
    'studio-note': {
        name: 'Studio Note',
        fonts: {
            title: { family: 'Verdana', size: 24, weight: 'bold', style: 'normal' },
            subtitle: { family: 'Segoe UI', size: 14, weight: 'normal', style: 'normal' },
            instrumentName: { family: 'Verdana', size: 13, weight: 'bold', style: 'normal' },
            beatLabel: { family: 'Verdana', size: 11, weight: 'normal', style: 'normal' },
            barNumber: { family: 'Verdana', size: 11, weight: 'bold', style: 'normal' },
            subdivisionLabel: { family: 'Verdana', size: 9, weight: 'normal', style: 'normal' },
            legend: { family: 'Verdana', size: 10, weight: 'normal', style: 'normal' }
        },
        grid: { 
            strokeThin: 1, 
            strokeBeat: 2, 
            strokeBar: 2.5 
        }
    },
    
    'print-heavy': {
        name: 'Print Heavy',
        fonts: {
            title: { family: 'Helvetica Neue', size: 26, weight: 'bold', style: 'normal' },
            subtitle: { family: 'Helvetica Neue', size: 15, weight: 'normal', style: 'normal' },
            instrumentName: { family: 'Helvetica Neue', size: 13, weight: 'bold', style: 'normal' },
            beatLabel: { family: 'Helvetica Neue', size: 11, weight: 'bold', style: 'normal' },
            barNumber: { family: 'Helvetica Neue', size: 11, weight: 'bold', style: 'normal' },
            subdivisionLabel: { family: 'Helvetica Neue', size: 9, weight: 'bold', style: 'normal' },
            legend: { family: 'Helvetica Neue', size: 10, weight: 'bold', style: 'normal' }
        },
        grid: { 
            strokeThin: 1, 
            strokeBeat: 2, 
            strokeBar: 3 
        }
    }
};

// Helper functions for theme management
export const ThemeHelpers = {
    /**
     * Apply a theme to the LAYOUT configuration
     */
    applyTheme(themeName, layoutObj) {
        const theme = THEMES[themeName];
        if (!theme) {
            console.warn(`Theme "${themeName}" not found`);
            return false;
        }
        
        // Apply fonts
        Object.assign(layoutObj.fonts, theme.fonts);
        
        // Apply grid settings
        Object.assign(layoutObj.grid, theme.grid);
        
        return true;
    },
    
    /**
     * Get default theme
     */
    getDefaultTheme() {
        return THEMES['modern-sans'];
    },
    
    /**
     * Create custom theme from current settings
     */
    createCustomTheme(layoutObj) {
        return {
            name: 'Custom',
            fonts: JSON.parse(JSON.stringify(layoutObj.fonts)),
            grid: {
                strokeThin: layoutObj.grid.strokeThin,
                strokeBeat: layoutObj.grid.strokeBeat,
                strokeBar: layoutObj.grid.strokeBar,
                beatGap: layoutObj.grid.beatGap,
                stepW: layoutObj.grid.stepW,
                nameCol: layoutObj.grid.nameCol,
                rowGap: layoutObj.grid.rowGap,
                labelOffsetBeats: layoutObj.grid.labelOffsetBeats,
                labelOffsetBars: layoutObj.grid.labelOffsetBars
            }
        };
    },
    
    /**
     * Get list of available theme names
     */
    getThemeNames() {
        return Object.keys(THEMES);
    },
    
    /**
     * Validate theme structure
     */
    isValidTheme(theme) {
        return theme && 
               theme.fonts && 
               theme.grid && 
               typeof theme.fonts === 'object' &&
               typeof theme.grid === 'object';
    }
};

export default THEMES;