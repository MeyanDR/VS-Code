import React, { useState } from 'react';
import { useAppState } from '../contexts/AppContext';
import { ChevronDown, ChevronRight } from 'lucide-react';

const NotesPanel = () => {
  const { state, dispatch } = useAppState();
  const [isExpanded, setIsExpanded] = useState(false);

  const currentSectionId = state.project.currentSection;
  const currentSection = state.project.sections[currentSectionId];
  const notes = currentSection?.notes || '';
  const sectionName = currentSection?.name || 'Untitled Section';

  const handleNotesChange = (e) => {
    const newNotes = e.target.value;

    dispatch({
      type: 'UPDATE_SECTION',
      payload: {
        sectionId: currentSectionId,
        updates: { notes: newNotes }
      }
    });
  };

  return (
    <div className="bg-daw-bg-secondary border-b border-daw-border">
      {/* Header Bar - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center gap-2 hover:bg-daw-bg-panel transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-daw-text-secondary" />
        ) : (
          <ChevronRight className="w-4 h-4 text-daw-text-secondary" />
        )}
        <span className="text-sm font-medium text-daw-text-primary">
          Notes
        </span>
        <span className="text-xs text-daw-text-secondary">
          ({sectionName})
        </span>
        {!isExpanded && notes && (
          <span className="ml-auto text-xs text-daw-text-tertiary italic truncate max-w-md">
            {notes.substring(0, 50)}{notes.length > 50 ? '...' : ''}
          </span>
        )}
      </button>

      {/* Expandable Notes Area */}
      {isExpanded && (
        <div className="px-4 pb-3">
          <textarea
            value={notes}
            onChange={handleNotesChange}
            placeholder={`Write notes for "${sectionName}"...`}
            className="w-full bg-daw-bg-panel border border-daw-border rounded px-3 py-2 text-sm text-daw-text-primary placeholder-daw-text-tertiary focus:outline-none focus:ring-1 focus:ring-daw-accent resize-y min-h-[60px] max-h-[200px]"
            maxLength={5000}
          />
          <div className="mt-1 text-xs text-daw-text-tertiary text-right">
            {notes.length} / 5000 characters
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesPanel;
