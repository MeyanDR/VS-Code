// Utilities for working with selection keys of the form `${instrumentId}-${position}`
// Instrument IDs may contain dashes (e.g., when sections are duplicated),
// so always split on the last dash to extract the numeric position safely.

export function parseStepKey(stepKey) {
  if (typeof stepKey !== 'string') {
    return { instrumentId: '', position: NaN }
  }
  const idx = stepKey.lastIndexOf('-')
  if (idx === -1) {
    return { instrumentId: stepKey, position: NaN }
  }
  const instrumentId = stepKey.slice(0, idx)
  const positionStr = stepKey.slice(idx + 1)
  const position = parseInt(positionStr, 10)
  return { instrumentId, position }
}

export function makeStepKey(instrumentId, position) {
  return `${instrumentId}-${position}`
}

