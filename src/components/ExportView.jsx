import React from 'react'
import { useAppState } from '../contexts/AppContext'

// Match Grid.jsx constants exactly (can be overridden by props)
const DEFAULT_BEAT_UNIT_WIDTH = 192
const DEFAULT_BEAT_ANCHOR_WIDTH = 40
const DEFAULT_GAP_AFTER_ANCHOR = 12
const DEFAULT_STEP_GAP = 2
const DEFAULT_INSTRUMENT_LABEL_WIDTH = 80
const DEFAULT_ROW_SPACING = 12

const ExportView = ({
  sectionId = null,
  beatUnitWidth = DEFAULT_BEAT_UNIT_WIDTH,
  instrumentLabelWidth = DEFAULT_INSTRUMENT_LABEL_WIDTH,
  stepGap = DEFAULT_STEP_GAP,
  rowSpacing = DEFAULT_ROW_SPACING,
  pageWidth = null,  // If provided, will calculate line breaks
  pageHeight = null,  // If provided, will split instruments across pages
  currentPage = 0,  // Which page to render (0-indexed)
  exportMode = false  // If true, render all pages for export
}) => {
  const { state } = useAppState()

  // Calculate derived widths
  const BEAT_UNIT_WIDTH = beatUnitWidth
  const BEAT_ANCHOR_WIDTH = DEFAULT_BEAT_ANCHOR_WIDTH  // Keep fixed
  const GAP_AFTER_ANCHOR = DEFAULT_GAP_AFTER_ANCHOR  // Keep fixed
  const SUBDIVISION_AREA_WIDTH = BEAT_UNIT_WIDTH - BEAT_ANCHOR_WIDTH - GAP_AFTER_ANCHOR
  const STEP_GAP = stepGap
  const INSTRUMENT_LABEL_WIDTH = instrumentLabelWidth
  const ROW_SPACING = rowSpacing

  // Get the section to export (current or specific)
  const section = sectionId
    ? state.project?.sections?.[sectionId]
    : state.project?.sections?.[state.project?.currentSection]

  if (!section) return null

  // Get section data
  const instruments = section.instruments || []
  const grid = section.grid || { bars: 2, beats: 4, subdivisions: 4 }
  const beatSubdivisions = grid.beatSubdivisions || Array(grid.bars * grid.beats).fill(grid.subdivisions)
  const metadata = section.metadata || { tempo: 120, type: 'loop', loopLength: null }
  const groups = section.groups || []

  // Get all available symbols
  const availableSymbols = state.ui?.availableSymbols || []
  const availableArticulationModifiers = state.ui?.availableArticulationModifiers || []
  const availableTechniqueModifiers = state.ui?.availableTechniqueModifiers || []
  const availableEffectModifiers = state.ui?.availableEffectModifiers || []

  // Create lookup maps
  const symbolsMap = {}
  availableSymbols.forEach(sym => {
    symbolsMap[sym.value] = sym
  })

  const articulationMap = {}
  availableArticulationModifiers.forEach(mod => {
    articulationMap[mod.value] = mod
  })

  const techniqueMap = {}
  availableTechniqueModifiers.forEach(mod => {
    techniqueMap[mod.value] = mod
  })

  const effectMap = {}
  availableEffectModifiers.forEach(mod => {
    effectMap[mod.value] = mod
  })

  // Collect used symbols and modifiers
  const usedSymbols = new Set()
  const usedModifiers = new Set()
  instruments.forEach(inst => {
    if (inst.pattern) {
      inst.pattern.forEach(note => {
        if (note.symbol && note.symbol !== '/' && note.symbol !== '') {
          usedSymbols.add(note.symbol)
        }
        if (note.modifier && note.modifier !== '') {
          usedModifiers.add(note.modifier)
        }
        if (note.technique && note.technique !== '') {
          usedModifiers.add(note.technique)
        }
        if (note.effect && note.effect !== '') {
          usedModifiers.add(note.effect)
        }
      })
    }
  })

  // Calculate line breaks for bars if pageWidth is provided
  const calculateBarLayout = () => {
    if (!pageWidth) {
      // No line breaks - render all bars in one line
      return [{ startBar: 0, endBar: grid.bars }]
    }

    // Calculate how much width is available for bars
    const availableWidth = pageWidth - INSTRUMENT_LABEL_WIDTH - 80 // Label + padding

    // Calculate width per bar
    const barWidth = grid.beats * BEAT_UNIT_WIDTH + 2 // +2 for bar separator

    // Calculate how many bars fit per line
    const barsPerLine = Math.max(1, Math.floor(availableWidth / barWidth))

    // Create line break layout
    const lines = []
    for (let i = 0; i < grid.bars; i += barsPerLine) {
      lines.push({
        startBar: i,
        endBar: Math.min(i + barsPerLine, grid.bars)
      })
    }

    return lines
  }

  const barLayout = calculateBarLayout()

  // Calculate step width (matching Grid.jsx formula)
  const getStepWidth = (subdivisionCount) => {
    if (subdivisionCount === 1) {
      return SUBDIVISION_AREA_WIDTH
    }
    const totalGaps = (subdivisionCount - 1) * STEP_GAP
    const availableWidth = SUBDIVISION_AREA_WIDTH - totalGaps
    return Math.floor(availableWidth / subdivisionCount)
  }

  // Get note at specific position
  const getNoteAt = (instrument, beatIndex, subdivisionIndex) => {
    return instrument.pattern?.find(n =>
      n.beatIndex === beatIndex && n.subdivision === subdivisionIndex
    )
  }

  // Render a single beat unit (matching Grid.jsx exactly)
  const renderBeatUnit = (instrument, barIndex, beatInBar) => {
    const globalBeatIndex = barIndex * grid.beats + beatInBar
    const subdivisionCount = beatSubdivisions[globalBeatIndex] || grid.subdivisions
    const stepWidth = getStepWidth(subdivisionCount)
    const hasCustomSubdivisions = subdivisionCount !== grid.subdivisions

    return (
      <div
        key={`${barIndex}-${beatInBar}`}
        style={{
          display: 'inline-block',
          width: `${BEAT_UNIT_WIDTH}px`
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          height: '32px',  // h-8
          position: 'relative'
        }}>
          {/* Beat Anchor - exactly like Grid.jsx */}
          <div style={{ width: `${BEAT_ANCHOR_WIDTH}px`, flexShrink: 0 }}>
            <div style={{
              width: '100%',
              height: '32px',
              border: '2px solid #000000',  // Black border (2px bold)
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffffff',  // White background
              fontFamily: 'monospace',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#000000'  // Black text
            }}>
              {barIndex + 1}.{beatInBar + 1}
            </div>
          </div>

          {/* Subdivision change indicator (export-only feature) */}
          {hasCustomSubdivisions && (
            <div style={{
              position: 'absolute',
              top: '-18px',
              left: `${BEAT_ANCHOR_WIDTH + GAP_AFTER_ANCHOR + (SUBDIVISION_AREA_WIDTH / 2)}px`,
              transform: 'translateX(-50%)',
              fontSize: '10px',
              color: '#666666'
            }}>
              ({subdivisionCount})
            </div>
          )}

          {/* Subdivision steps container */}
          <div style={{
            marginLeft: `${GAP_AFTER_ANCHOR}px`,
            display: 'flex',
            alignItems: 'center',
            width: `${SUBDIVISION_AREA_WIDTH}px`,
            gap: subdivisionCount > 1 ? `${STEP_GAP}px` : 0
          }}>
            {Array.from({ length: subdivisionCount }, (_, subdivIndex) => {
              const note = getNoteAt(instrument, globalBeatIndex, subdivIndex)
              const isFirstStep = subdivIndex === 0

              return (
                <div
                  key={subdivIndex}
                  style={{
                    width: `${stepWidth}px`,
                    flexShrink: 0
                  }}
                >
                  {/* Subdivision Step - matching SubdivisionStep.jsx structure */}
                  <div style={{
                    width: '100%',
                    height: '48px',  // h-12
                    border: isFirstStep ? '2px solid #000000' : '1px solid #dddddd',  // BOLD first, normal others
                    borderRadius: '4px',
                    backgroundColor: note ? '#e8e8e8' : '#ffffff',  // Light gray if filled, white if empty
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: note ? 'bold' : 'normal',
                    color: '#000000',
                    padding: '2px'
                  }}>
                    {note && note.symbol && note.symbol !== '/' ? (
                      <>
                        {/* Effect (top) */}
                        {note.effect && (
                          <div style={{ height: '12px', fontSize: '10px', lineHeight: '12px' }}>
                            {note.effect}
                          </div>
                        )}

                        {/* Symbol + Modifier (center) */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'center',
                          flex: 1
                        }}>
                          <span style={{ fontWeight: 'bold' }}>
                            {note.modifier === '(...)' ? `(${note.symbol})` : note.symbol}
                          </span>
                          {note.modifier && note.modifier !== '(...)' && (
                            <sup style={{ fontSize: '10px', marginLeft: '1px', marginTop: '-2px' }}>
                              {note.modifier}
                            </sup>
                          )}
                        </div>

                        {/* Technique (bottom) */}
                        {note.technique && (
                          <div style={{ height: '12px', fontSize: '10px', lineHeight: '12px' }}>
                            {note.technique}
                          </div>
                        )}
                      </>
                    ) : (
                      <span style={{ color: '#cccccc', fontSize: '12px' }}>·</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Render a line of bars for an instrument
  const renderBarLine = (instrument, lineConfig) => {
    const barsInLine = lineConfig.endBar - lineConfig.startBar

    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 0 }}>
        {Array.from({ length: barsInLine }, (_, idx) => {
          const barIndex = lineConfig.startBar + idx
          const isLastBarInLine = idx === barsInLine - 1

          return (
            <div
              key={barIndex}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0,
                borderRight: !isLastBarInLine ? '2px solid #cccccc' : 'none',  // Bar separator
                paddingRight: !isLastBarInLine ? '2px' : '0'
              }}
            >
              {Array.from({ length: grid.beats }, (_, beatInBar) =>
                renderBeatUnit(instrument, barIndex, beatInBar)
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Render instrument row (with line breaks if needed)
  const renderInstrumentRow = (instrument) => {
    if (barLayout.length === 1) {
      // Single line - render as before
      return (
        <div
          key={instrument.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: `${ROW_SPACING}px`
          }}
        >
          {/* Instrument label */}
          <div style={{
            width: `${INSTRUMENT_LABEL_WIDTH}px`,
            flexShrink: 0,
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#000000'
          }}>
            {instrument.name}
          </div>

          {/* All bars in one line */}
          <div style={{ flex: 1 }}>
            {renderBarLine(instrument, barLayout[0])}
          </div>
        </div>
      )
    } else {
      // Multiple lines - render with line breaks
      return (
        <div key={instrument.id} style={{ marginBottom: `${ROW_SPACING * 2}px` }}>
          {barLayout.map((lineConfig, lineIdx) => (
            <div
              key={lineIdx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: lineIdx < barLayout.length - 1 ? `${ROW_SPACING}px` : '0'
              }}
            >
              {/* Instrument label - only show on first line */}
              <div style={{
                width: `${INSTRUMENT_LABEL_WIDTH}px`,
                flexShrink: 0,
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#000000'
              }}>
                {lineIdx === 0 ? instrument.name : ''}
              </div>

              {/* Bars for this line */}
              <div style={{ flex: 1 }}>
                {renderBarLine(instrument, lineConfig)}
              </div>
            </div>
          ))}
        </div>
      )
    }
  }

  // Render grouped instruments
  const renderGroupedInstruments = () => {
    if (groups.length === 0) {
      return instruments.map(inst => renderInstrumentRow(inst))
    }

    const result = []

    // Render each group
    groups.forEach(group => {
      const groupInstruments = instruments.filter(inst => inst.groupId === group.id)
      if (groupInstruments.length === 0) return

      result.push(
        <div
          key={group.id}
          style={{
            backgroundColor: '#f9f9f9',  // Light gray background for groups
            border: '1px solid #666666',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}
        >
          {/* Group name */}
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#000000',
            marginBottom: '12px',
            borderBottom: '1px solid #cccccc',
            paddingBottom: '8px'
          }}>
            {group.name}
          </div>

          {/* Group instruments */}
          {groupInstruments.map(inst => renderInstrumentRow(inst))}
        </div>
      )
    })

    // Render ungrouped instruments
    const ungrouped = instruments.filter(inst => !inst.groupId)
    ungrouped.forEach(inst => {
      result.push(renderInstrumentRow(inst))
    })

    return result
  }

  // Calculate pagination if pageHeight is provided
  const calculatePagination = () => {
    if (!pageHeight) {
      // No pagination - render all instruments on one page
      return [{ instruments: renderGroupedInstruments(), pageNumber: 1 }]
    }

    // Estimate heights
    const HEADER_HEIGHT = 120  // Title + section header + metadata
    const LEGEND_HEIGHT = usedSymbols.size > 0 || usedModifiers.size > 0 ? 200 : 0
    const PAGE_PADDING = 80  // Top + bottom padding (40px each)

    // Calculate instrument row height
    const BEAT_ANCHOR_HEIGHT = 32
    const SUBDIVISION_STEP_HEIGHT = 48
    const INSTRUMENT_ROW_HEIGHT = Math.max(BEAT_ANCHOR_HEIGHT, SUBDIVISION_STEP_HEIGHT) + ROW_SPACING
    const MULTI_LINE_EXTRA = barLayout.length > 1 ? ROW_SPACING * barLayout.length : 0
    const ESTIMATED_ROW_HEIGHT = INSTRUMENT_ROW_HEIGHT + MULTI_LINE_EXTRA

    // Group spacing
    const GROUP_EXTRA_HEIGHT = 60  // Group container padding + header

    // Available height per page
    const FIRST_PAGE_AVAILABLE = pageHeight - HEADER_HEIGHT - PAGE_PADDING - LEGEND_HEIGHT - 50 // Extra buffer
    const SUBSEQUENT_PAGE_AVAILABLE = pageHeight - PAGE_PADDING - 100 // Header repeat + buffer

    // Calculate how many instruments fit per page
    const instrumentsPerFirstPage = Math.max(1, Math.floor(FIRST_PAGE_AVAILABLE / ESTIMATED_ROW_HEIGHT))
    const instrumentsPerSubsequentPage = Math.max(1, Math.floor(SUBSEQUENT_PAGE_AVAILABLE / ESTIMATED_ROW_HEIGHT))

    // Split instruments into pages
    const pages = []
    const totalInstruments = instruments.length

    if (totalInstruments <= instrumentsPerFirstPage) {
      // All fit on first page
      pages.push({
        instruments: renderGroupedInstruments(),
        pageNumber: 1,
        showHeader: true,
        showLegend: true
      })
    } else {
      // Multiple pages needed
      let remainingInstruments = [...instruments]
      let pageNumber = 1

      // First page
      const firstPageInstruments = remainingInstruments.slice(0, instrumentsPerFirstPage)
      pages.push({
        instruments: firstPageInstruments.map(inst => renderInstrumentRow(inst)),
        pageNumber: pageNumber++,
        showHeader: true,
        showLegend: false  // Legend on last page only
      })
      remainingInstruments = remainingInstruments.slice(instrumentsPerFirstPage)

      // Subsequent pages
      while (remainingInstruments.length > 0) {
        const pageInstruments = remainingInstruments.slice(0, instrumentsPerSubsequentPage)
        const isLastPage = remainingInstruments.length <= instrumentsPerSubsequentPage

        pages.push({
          instruments: pageInstruments.map(inst => renderInstrumentRow(inst)),
          pageNumber: pageNumber++,
          showHeader: false,  // No header on continuation pages
          showLegend: isLastPage  // Legend only on last page
        })
        remainingInstruments = remainingInstruments.slice(instrumentsPerSubsequentPage)
      }
    }

    return pages
  }

  const pages = calculatePagination()

  // Render header component
  const renderHeader = () => (
    <>
      {/* Header */}
      <div style={{
        marginBottom: '20px',
        borderBottom: '2px solid #000000',
        paddingBottom: '15px'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          margin: '0 0 10px 0',
          color: '#000000'
        }}>
          {state.project?.name || 'Drum Pattern'}
          {metadata.tempo && (
            <span style={{
              fontSize: '20px',
              marginLeft: '15px',
              fontWeight: 'normal'
            }}>
              - {metadata.tempo} bpm
            </span>
          )}
        </h1>
      </div>

      {/* Section Header */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          margin: '0 0 8px 0',
          color: '#000000'
        }}>
          {section.name || 'Section'}
        </h2>

        {/* Section Metadata */}
        <div style={{
          fontSize: '11px',
          color: '#666666',
          marginBottom: '6px'
        }}>
          {grid.bars} bars × {grid.beats} beats × {grid.subdivisions} subdivision | {metadata.type || 'loop'}
        </div>

        {/* Section Notes */}
        {section.notes && (
          <div style={{
            fontSize: '11px',
            color: '#333333',
            fontStyle: 'italic',
            marginTop: '8px',
            padding: '8px',
            background: '#f9f9f9',
            border: '1px solid #dddddd',
            borderRadius: '4px'
          }}>
            "{section.notes}"
          </div>
        )}
      </div>
    </>
  )

  // Render legend component
  const renderLegend = () => (
    (usedSymbols.size > 0 || usedModifiers.size > 0) && (
      <div style={{
        borderTop: '2px solid #000000',
        paddingTop: '20px',
        marginTop: '30px'
      }}>
        <h3 style={{
          fontSize: '16px',
          margin: '0 0 15px 0',
          color: '#000000',
          fontWeight: 'bold'
        }}>
          Legend:
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          {/* Symbols */}
          {Array.from(usedSymbols).map(symbol => {
            const symbolData = symbolsMap[symbol]
            if (!symbolData) return null

            return (
              <div
                key={symbol}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '12px',
                  padding: '6px',
                  border: '1px solid #dddddd',
                  background: '#ffffff'
                }}
              >
                <span style={{
                  fontWeight: 'bold',
                  fontSize: '16px',
                  minWidth: '24px',
                  textAlign: 'center',
                  color: '#000000'
                }}>
                  {symbol}
                </span>
                <span style={{ color: '#000000' }}>
                  = {symbolData.description || symbolData.label}
                </span>
              </div>
            )
          })}

          {/* Modifiers */}
          {Array.from(usedModifiers).map(modifier => {
            const modData = articulationMap[modifier] || techniqueMap[modifier] || effectMap[modifier]
            if (!modData) return null

            return (
              <div
                key={modifier}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '12px',
                  padding: '6px',
                  border: '1px solid #dddddd',
                  background: '#ffffff'
                }}
              >
                <span style={{
                  fontWeight: 'bold',
                  fontSize: '16px',
                  minWidth: '24px',
                  textAlign: 'center',
                  color: '#000000'
                }}>
                  {modifier}
                </span>
                <span style={{ color: '#000000' }}>
                  = {modData.description || modData.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  )

  // For export mode, render all pages stacked. For preview, render only current page.
  if (exportMode) {
    return (
      <div id="export-view">
        {pages.map((page, pageIndex) => (
          <div
            key={pageIndex}
            style={{
              background: '#FFFFFF',
              color: '#000000',
              padding: '40px',
              fontFamily: 'Arial, sans-serif',
              maxWidth: '100%',
              margin: '0 auto',
              boxSizing: 'border-box',
              minHeight: pageHeight ? `${pageHeight}px` : 'auto',
              pageBreakAfter: pageIndex < pages.length - 1 ? 'always' : 'auto',
              pageBreakInside: 'avoid',
              position: 'relative'
            }}
          >
            {/* Page number indicator (for multi-page) */}
            {pages.length > 1 && (
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '40px',
                fontSize: '10px',
                color: '#999999'
              }}>
                Page {page.pageNumber} of {pages.length}
              </div>
            )}

            {/* Header (only on pages that should show it) */}
            {page.showHeader && renderHeader()}

            {/* Pattern Grid */}
            <div style={{ marginBottom: '30px' }}>
              {page.instruments}
            </div>

            {/* Legend (only on pages that should show it) */}
            {page.showLegend && renderLegend()}
          </div>
        ))}

        {/* Print-specific styles */}
        <style>{`
          @media print {
            #export-view {
              background: #FFFFFF !important;
              color: #000000 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }

          @page {
            size: A4;
            margin: 0;
          }
        `}</style>
      </div>
    )
  }

  // Preview mode: render only the current page
  const page = pages[currentPage] || pages[0]

  return (
    <div
      id="export-view"
      style={{
        background: '#FFFFFF',
        color: '#000000',
        padding: '40px',
        fontFamily: 'Arial, sans-serif',
        maxWidth: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
        minHeight: pageHeight ? `${pageHeight}px` : 'auto',
        position: 'relative'
      }}
    >
      {/* Page number indicator (for multi-page) */}
      {pages.length > 1 && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '40px',
          fontSize: '10px',
          color: '#999999'
        }}>
          Page {page.pageNumber} of {pages.length}
        </div>
      )}

      {/* Header (only on pages that should show it) */}
      {page.showHeader && renderHeader()}

      {/* Pattern Grid */}
      <div style={{ marginBottom: '30px' }}>
        {page.instruments}
      </div>

      {/* Legend (only on pages that should show it) */}
      {page.showLegend && renderLegend()}

      {/* Print-specific styles */}
      <style>{`
        @media print {
          #export-view {
            background: #FFFFFF !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

        @page {
          size: A4;
          margin: 0;
        }
      `}</style>
    </div>
  )
}

// Export a utility function to get the total number of pages
export const getExportPageCount = ({
  instruments = [],
  pageHeight = null,
  rowSpacing = DEFAULT_ROW_SPACING,
  barLayoutLength = 1
}) => {
  if (!pageHeight || instruments.length === 0) return 1

  const HEADER_HEIGHT = 120
  const LEGEND_HEIGHT = 200
  const PAGE_PADDING = 80
  const BEAT_ANCHOR_HEIGHT = 32
  const SUBDIVISION_STEP_HEIGHT = 48
  const INSTRUMENT_ROW_HEIGHT = Math.max(BEAT_ANCHOR_HEIGHT, SUBDIVISION_STEP_HEIGHT) + rowSpacing
  const MULTI_LINE_EXTRA = barLayoutLength > 1 ? rowSpacing * barLayoutLength : 0
  const ESTIMATED_ROW_HEIGHT = INSTRUMENT_ROW_HEIGHT + MULTI_LINE_EXTRA

  const FIRST_PAGE_AVAILABLE = pageHeight - HEADER_HEIGHT - PAGE_PADDING - LEGEND_HEIGHT - 50
  const SUBSEQUENT_PAGE_AVAILABLE = pageHeight - PAGE_PADDING - 100

  const instrumentsPerFirstPage = Math.max(1, Math.floor(FIRST_PAGE_AVAILABLE / ESTIMATED_ROW_HEIGHT))
  const instrumentsPerSubsequentPage = Math.max(1, Math.floor(SUBSEQUENT_PAGE_AVAILABLE / ESTIMATED_ROW_HEIGHT))

  if (instruments.length <= instrumentsPerFirstPage) {
    return 1
  }

  let remainingCount = instruments.length - instrumentsPerFirstPage
  return 1 + Math.ceil(remainingCount / instrumentsPerSubsequentPage)
}

export default ExportView
