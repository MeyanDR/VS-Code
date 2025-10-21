# NEW_PROJECT Implementation Summary

## Changes Made

### 1. Actions (src/core/actions.js)
- Added `NEW_PROJECT: 'NEW_PROJECT'` action type
- Added `newProject()` action creator

### 2. Reducers (src/contexts/AppContext.jsx)
- **projectReducer**: Returns `initialState.project` - resets to 1 instrument, intro section, 4/4/4 grid
- **uiReducer**: Returns `initialState.ui` - resets selection, symbols, modifiers, etc.
- **midiReducer**: Returns `initialState.midi` - resets MIDI settings
- **layoutReducer**: Returns `initialState.layout` - resets layout settings
- **breaksReducer**: Returns `initialState.breaks` - clears all breaks
- **themesReducer**: Returns `initialState.themes` - resets to default theme

### 3. UI (src/components/ControlPanel.jsx)
- Updated `handleNew()` to dispatch `NEW_PROJECT` instead of `CLEAR_ALL`
- Maintains confirmation dialog: "Create new project? Unsaved changes will be lost."

## Button Behavior

### "New" Button
- **Action**: `NEW_PROJECT`
- **Effect**: Complete reset to initial state
  - 1 instrument: "Instrument 1"
  - 1 section: "Intro"
  - Grid: 4 bars, 4 beats, 4 subdivisions
  - All notes cleared
  - UI state reset
  - Theme reset to default

### "Clear" Button  
- **Action**: `CLEAR_ALL`
- **Effect**: Only clears note patterns
  - Keeps all instruments
  - Keeps all sections
  - Keeps grid settings
  - Keeps UI settings
  - Keeps theme settings

## Testing
1. Add notes, instruments, sections, and change grid settings
2. Click "New" → Should reset everything to defaults
3. Add notes again
4. Click "Clear" → Should only clear notes, keep everything else