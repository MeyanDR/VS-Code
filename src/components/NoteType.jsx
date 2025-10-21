import React from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import { useAppState } from '../contexts/AppContext'

export default function NoteType({ 
  isDragOverSymbols, 
  setIsDragOverSymbols, 
  handleDrop, 
  handleDragOver, 
  handleSymbolChange, 
  handleRemoveSymbol,
  noteTypes,
  activeSymbol 
}) {
  return (
    <Accordion type="single" collapsible defaultValue="note-type" className="bg-daw-bg-secondary rounded-lg border border-daw-border">
      <AccordionItem value="note-type" className="border-0">
        <AccordionTrigger className="px-3 py-2 hover:no-underline">
          <span className="text-sm font-semibold text-daw-text-secondary">Note Type</span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="px-3 pb-3">
            <div
              onDrop={(e) => handleDrop(e, 'symbol')}
              onDragOver={handleDragOver}
              onDragEnter={() => setIsDragOverSymbols(true)}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setIsDragOverSymbols(false)
                }
              }}
              className={`
                p-2 rounded-lg transition-all
                ${isDragOverSymbols 
                  ? 'bg-daw-accent/10 border-2 border-daw-accent border-dashed' 
                  : 'border-2 border-transparent'
                }
              `}
            >
              {isDragOverSymbols && (
                <div className="text-xs text-daw-accent mb-2">Drop symbol here</div>
              )}
              
              {noteTypes.length === 0 ? (
                <div className="text-xs text-daw-text-dim text-center p-4 border-2 border-dashed border-daw-border rounded">
                  Drag symbols from the reference panel to add them here
                </div>
              ) : (
                <div className="space-y-1.5">
                  {noteTypes.map((note) => (
                    <div key={note.value} className="flex items-center gap-2">
                      <button
                        onClick={() => handleSymbolChange(note.value)}
                        className={`
                          flex items-center gap-2 text-xs flex-1 text-left p-1 rounded transition-all
                          ${activeSymbol === note.value 
                            ? 'bg-daw-accent/20 text-daw-accent' 
                            : 'text-daw-text-primary hover:bg-daw-button/50'
                          }
                        `}
                      >
                        <span className={`
                          w-4 h-4 rounded-full border-2 flex items-center justify-center
                          ${activeSymbol === note.value 
                            ? 'border-daw-accent' 
                            : 'border-daw-text-secondary'
                          }
                        `}>
                          {activeSymbol === note.value && (
                            <span className="w-2 h-2 bg-daw-accent rounded-full"></span>
                          )}
                        </span>
                        <span className="font-bold w-5 text-center">{note.value}</span>
                        <span>{note.label || note.description}</span>
                      </button>
                      {noteTypes.length > 1 && (
                        <button
                          onClick={() => handleRemoveSymbol(note.value)}
                          className="text-xs text-daw-text-dim hover:text-red-400 px-1"
                          title="Remove symbol"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}