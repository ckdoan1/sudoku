import { useState, useEffect } from 'react'
import './App.css'

// Initial puzzle (0 represents empty cells)
const initialPuzzle = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
]

// Create empty notes grid (each cell has a Set of candidate numbers)
const createEmptyNotes = () =>
  Array(9).fill(null).map(() =>
    Array(9).fill(null).map(() => new Set())
  )

function App() {
  const [board, setBoard] = useState(initialPuzzle)
  const [notes, setNotes] = useState(createEmptyNotes)
  const [autoNotes, setAutoNotes] = useState(createEmptyNotes)
  const [selectedCell, setSelectedCell] = useState(null)
  const [isNotesMode, setIsNotesMode] = useState(false)
  const [history, setHistory] = useState([])
  const [highlightedNumber, setHighlightedNumber] = useState(null)
  const [highlightedCell, setHighlightedCell] = useState(null)

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Number keys 1-9
      if (e.key >= '1' && e.key <= '9') {
        const num = parseInt(e.key)
        if (selectedCell) {
          handleNumberInput(num)
        }
        // Only highlight if not in notes mode
        if (!isNotesMode) {
          if (highlightedNumber === num) {
            setHighlightedNumber(null)
            setHighlightedCell(null)
          } else {
            setHighlightedNumber(num)
            setHighlightedCell(null)
          }
        }
      }
      // Backspace, Delete, or 0 to clear
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        if (selectedCell) {
          handleNumberInput(0)
        }
      }
      // Arrow keys for navigation
      if (selectedCell && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        let { row, col } = selectedCell
        if (e.key === 'ArrowUp' && row > 0) row--
        if (e.key === 'ArrowDown' && row < 8) row++
        if (e.key === 'ArrowLeft' && col > 0) col--
        if (e.key === 'ArrowRight' && col < 8) col++
        // Only select if it's an editable cell
        if (initialPuzzle[row][col] === 0) {
          setSelectedCell({ row, col })
          setHighlightedNumber(null)
          setHighlightedCell(null)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedCell, highlightedNumber, isNotesMode])

  // Get valid candidates for a cell based on Sudoku rules
  const getValidCandidates = (currentBoard, row, col) => {
    if (currentBoard[row][col] !== 0) return new Set()

    const candidates = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9])

    // Check row
    for (let c = 0; c < 9; c++) {
      candidates.delete(currentBoard[row][c])
    }

    // Check column
    for (let r = 0; r < 9; r++) {
      candidates.delete(currentBoard[r][col])
    }

    // Check 3x3 block
    const blockRowStart = Math.floor(row / 3) * 3
    const blockColStart = Math.floor(col / 3) * 3
    for (let r = blockRowStart; r < blockRowStart + 3; r++) {
      for (let c = blockColStart; c < blockColStart + 3; c++) {
        candidates.delete(currentBoard[r][c])
      }
    }

    return candidates
  }

  // Fill all empty cells with auto-calculated candidates
  const fillAutoNotes = () => {
    saveToHistory()
    const newAutoNotes = Array(9).fill(null).map(() =>
      Array(9).fill(null).map(() => new Set())
    )

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          newAutoNotes[row][col] = getValidCandidates(board, row, col)
        }
      }
    }

    setAutoNotes(newAutoNotes)
  }

  // Check if cell is in same row, column, or 3x3 block as highlighted cell
  const isInHighlightedRegion = (row, col) => {
    if (!highlightedCell) return false

    const sameRow = row === highlightedCell.row
    const sameCol = col === highlightedCell.col
    const sameBlock =
      Math.floor(row / 3) === Math.floor(highlightedCell.row / 3) &&
      Math.floor(col / 3) === Math.floor(highlightedCell.col / 3)

    return sameRow || sameCol || sameBlock
  }

  const handleCellClick = (row, col, e) => {
    const cellValue = board[row][col]

    if (cellValue !== 0) {
      // Clicking on a filled cell - toggle highlight for that number
      if (highlightedNumber === cellValue && highlightedCell?.row === row && highlightedCell?.col === col) {
        setHighlightedNumber(null)
        setHighlightedCell(null)
      } else {
        setHighlightedNumber(cellValue)
        setHighlightedCell({ row, col })
      }
      return
    }

    // Clicking on empty cell clears highlight and selects for editing
    setHighlightedNumber(null)
    setHighlightedCell(null)
    if (initialPuzzle[row][col] === 0) {
      setSelectedCell({ row, col })
    }
  }

  const saveToHistory = () => {
    setHistory(prev => [...prev, {
      board: board.map(row => [...row]),
      notes: notes.map(row => row.map(cell => new Set(cell))),
      autoNotes: autoNotes.map(row => row.map(cell => new Set(cell)))
    }])
  }

  const handleUndo = () => {
    if (history.length === 0) return

    const previousState = history[history.length - 1]
    setBoard(previousState.board)
    setNotes(previousState.notes)
    setAutoNotes(previousState.autoNotes)
    setHistory(prev => prev.slice(0, -1))
  }

  const handleNumberPadClick = (num) => {
    // Toggle highlight for this number (only if not in notes mode)
    if (num !== 0 && !isNotesMode) {
      if (highlightedNumber === num) {
        setHighlightedNumber(null)
        setHighlightedCell(null)
      } else {
        setHighlightedNumber(num)
        setHighlightedCell(null)
      }
    }
    // Also input the number if a cell is selected
    handleNumberInput(num)
  }

  const handleNumberInput = (num) => {
    if (!selectedCell) return
    const { row, col } = selectedCell

    saveToHistory()

    if (isNotesMode && num !== 0) {
      const hasManualNote = notes[row][col].has(num)
      const hasAutoNote = autoNotes[row][col].has(num)

      if (hasAutoNote && !hasManualNote) {
        // If it's only in auto notes, just remove from auto notes
        setAutoNotes(prev => {
          const newAutoNotes = prev.map(r => r.map(c => new Set(c)))
          newAutoNotes[row][col].delete(num)
          return newAutoNotes
        })
      } else {
        // Toggle manual notes
        setNotes(prev => {
          const newNotes = prev.map(r => r.map(c => new Set(c)))
          if (newNotes[row][col].has(num)) {
            newNotes[row][col].delete(num)
          } else {
            newNotes[row][col].add(num)
          }
          return newNotes
        })
        // Also remove from auto notes if adding manually
        if (!hasManualNote) {
          setAutoNotes(prev => {
            const newAutoNotes = prev.map(r => r.map(c => new Set(c)))
            newAutoNotes[row][col].delete(num)
            return newAutoNotes
          })
        }
      }
    } else {
      // Normal mode: set the cell value
      const newBoard = board.map((r, rowIndex) =>
        r.map((cell, colIndex) =>
          rowIndex === row && colIndex === col ? num : cell
        )
      )
      setBoard(newBoard)

      // Clear notes for this cell when placing a number
      if (num !== 0) {
        setNotes(prev => {
          const newNotes = prev.map(r => r.map(c => new Set(c)))
          newNotes[row][col].clear()
          return newNotes
        })
        setAutoNotes(prev => {
          const newAutoNotes = prev.map(r => r.map(c => new Set(c)))
          newAutoNotes[row][col].clear()
          return newAutoNotes
        })
      }
    }
  }

  const isInitialCell = (row, col) => initialPuzzle[row][col] !== 0

  const renderCellContent = (row, col, cellValue) => {
    if (cellValue !== 0) {
      return (
        <span className={highlightedNumber === cellValue ? 'highlighted-number' : ''}>
          {cellValue}
        </span>
      )
    }

    const cellNotes = notes[row][col]
    const cellAutoNotes = autoNotes[row][col]
    const hasAnyNotes = cellNotes.size > 0 || cellAutoNotes.size > 0

    if (hasAnyNotes) {
      return (
        <div className="notes-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
            const isManualNote = cellNotes.has(num)
            const isAutoNote = cellAutoNotes.has(num) && !isManualNote
            const hasNote = isManualNote || isAutoNote
            const isHighlighted = hasNote && highlightedNumber === num

            return (
              <span
                key={num}
                className={`note-number ${isAutoNote ? 'auto' : ''} ${isHighlighted ? 'highlighted' : ''}`}
              >
                {hasNote ? num : ''}
              </span>
            )
          })}
        </div>
      )
    }

    return ''
  }

  // Check if cell has any notes (manual or auto)
  const cellHasNotes = (row, col) => {
    return notes[row][col].size > 0 || autoNotes[row][col].size > 0
  }

  return (
    <div className="container">
      <h1 className="title">Sudoku</h1>

      <div className="board">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="row">
            {row.map((cell, colIndex) => (
              <div
                key={colIndex}
                className={`cell
                  ${isInitialCell(rowIndex, colIndex) ? 'initial' : 'editable'}
                  ${selectedCell?.row === rowIndex && selectedCell?.col === colIndex ? 'selected' : ''}
                  ${colIndex % 3 === 2 && colIndex !== 8 ? 'border-right' : ''}
                  ${rowIndex % 3 === 2 && rowIndex !== 8 ? 'border-bottom' : ''}
                  ${cellHasNotes(rowIndex, colIndex) && cell === 0 ? 'has-notes' : ''}
                  ${cell !== 0 && highlightedNumber === cell ? 'cell-highlighted' : ''}
                  ${isInHighlightedRegion(rowIndex, colIndex) ? 'region-highlighted' : ''}
                `}
                onClick={(e) => handleCellClick(rowIndex, colIndex, e)}
              >
                {renderCellContent(rowIndex, colIndex, cell)}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="controls">
        <button
          className="icon-btn"
          onClick={handleUndo}
          disabled={history.length === 0}
          title="Undo"
        >
          <i className="fa-solid fa-rotate-left"></i>
        </button>
        <button
          className="icon-btn"
          onClick={() => handleNumberInput(0)}
          title="Erase"
        >
          <i className="fa-solid fa-eraser"></i>
        </button>
        <button
          className="icon-btn"
          onClick={fillAutoNotes}
          title="Auto-fill candidates"
        >
          <i className="fa-solid fa-wand-magic-sparkles"></i>
        </button>
        <button
          className={`icon-btn with-text ${isNotesMode ? 'active' : ''}`}
          onClick={() => setIsNotesMode(!isNotesMode)}
        >
          <i className="fa-solid fa-pencil"></i>
          <span>{isNotesMode ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      <div className="number-pad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            className={`number-btn ${highlightedNumber === num ? 'active' : ''}`}
            onClick={() => handleNumberPadClick(num)}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  )
}

export default App
