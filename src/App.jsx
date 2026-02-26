import { useState, useEffect } from 'react'
import './App.css'

// Base solved puzzle to start from
const baseSolvedPuzzle = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
]

// ============= PUZZLE GENERATOR =============

// Deep copy a board
const copyBoard = (board) => board.map(row => [...row])

// Swap two rows within the same band
const swapRows = (board, row1, row2) => {
  const newBoard = copyBoard(board)
  ;[newBoard[row1], newBoard[row2]] = [newBoard[row2], newBoard[row1]]
  return newBoard
}

// Swap two columns within the same stack
const swapColumns = (board, col1, col2) => {
  const newBoard = copyBoard(board)
  for (let row = 0; row < 9; row++) {
    ;[newBoard[row][col1], newBoard[row][col2]] = [newBoard[row][col2], newBoard[row][col1]]
  }
  return newBoard
}

// Swap two bands (groups of 3 rows)
const swapBands = (board, band1, band2) => {
  const newBoard = copyBoard(board)
  for (let i = 0; i < 3; i++) {
    ;[newBoard[band1 * 3 + i], newBoard[band2 * 3 + i]] = [newBoard[band2 * 3 + i], newBoard[band1 * 3 + i]]
  }
  return newBoard
}

// Swap two stacks (groups of 3 columns)
const swapStacks = (board, stack1, stack2) => {
  const newBoard = copyBoard(board)
  for (let row = 0; row < 9; row++) {
    for (let i = 0; i < 3; i++) {
      ;[newBoard[row][stack1 * 3 + i], newBoard[row][stack2 * 3 + i]] = [newBoard[row][stack2 * 3 + i], newBoard[row][stack1 * 3 + i]]
    }
  }
  return newBoard
}

// Randomize a solved puzzle
const randomizePuzzle = (board, iterations = 50) => {
  let newBoard = copyBoard(board)

  for (let i = 0; i < iterations; i++) {
    const transformation = Math.floor(Math.random() * 4)
    const band = Math.floor(Math.random() * 3)
    const options = [0, 1, 2].sort(() => Math.random() - 0.5)
    const [piece1, piece2] = [options[0], options[1]]

    switch (transformation) {
      case 0: // Swap rows within band
        newBoard = swapRows(newBoard, band * 3 + piece1, band * 3 + piece2)
        break
      case 1: // Swap columns within stack
        newBoard = swapColumns(newBoard, band * 3 + piece1, band * 3 + piece2)
        break
      case 2: // Swap bands
        newBoard = swapBands(newBoard, piece1, piece2)
        break
      case 3: // Swap stacks
        newBoard = swapStacks(newBoard, piece1, piece2)
        break
    }
  }

  return newBoard
}

// Get possible values for a cell
const getPossibles = (board, row, col) => {
  if (board[row][col] !== 0) return new Set()

  const possible = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9])

  // Check row
  for (let c = 0; c < 9; c++) possible.delete(board[row][c])

  // Check column
  for (let r = 0; r < 9; r++) possible.delete(board[r][col])

  // Check box
  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      possible.delete(board[r][c])
    }
  }

  return possible
}

// Simple solver using backtracking
const solve = (board) => {
  const newBoard = copyBoard(board)

  const findEmpty = () => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (newBoard[r][c] === 0) return [r, c]
      }
    }
    return null
  }

  const isValid = (row, col, num) => {
    // Check row
    for (let c = 0; c < 9; c++) {
      if (newBoard[row][c] === num) return false
    }
    // Check column
    for (let r = 0; r < 9; r++) {
      if (newBoard[r][col] === num) return false
    }
    // Check box
    const boxRow = Math.floor(row / 3) * 3
    const boxCol = Math.floor(col / 3) * 3
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        if (newBoard[r][c] === num) return false
      }
    }
    return true
  }

  const solveRecursive = () => {
    const empty = findEmpty()
    if (!empty) return true

    const [row, col] = empty
    for (let num = 1; num <= 9; num++) {
      if (isValid(row, col, num)) {
        newBoard[row][col] = num
        if (solveRecursive()) return true
        newBoard[row][col] = 0
      }
    }
    return false
  }

  return solveRecursive() ? newBoard : null
}

// Check if puzzle has unique solution (optimized with early exit)
const hasUniqueSolution = (board) => {
  const newBoard = copyBoard(board)
  let solutions = 0

  // Find empty cell with minimum remaining values (MRV heuristic)
  const findBestEmpty = () => {
    let best = null
    let minOptions = 10
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (newBoard[r][c] === 0) {
          const options = getPossibles(newBoard, r, c).size
          if (options < minOptions) {
            minOptions = options
            best = [r, c]
            if (options === 1) return best // Can't do better than 1
          }
        }
      }
    }
    return best
  }

  const isValid = (row, col, num) => {
    for (let c = 0; c < 9; c++) if (newBoard[row][c] === num) return false
    for (let r = 0; r < 9; r++) if (newBoard[r][col] === num) return false
    const boxRow = Math.floor(row / 3) * 3
    const boxCol = Math.floor(col / 3) * 3
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        if (newBoard[r][c] === num) return false
      }
    }
    return true
  }

  const countSolutions = () => {
    if (solutions > 1) return // Early exit

    const empty = findBestEmpty()
    if (!empty) {
      solutions++
      return
    }

    const [row, col] = empty
    for (let num = 1; num <= 9; num++) {
      if (solutions > 1) return // Early exit
      if (isValid(row, col, num)) {
        newBoard[row][col] = num
        countSolutions()
        newBoard[row][col] = 0
      }
    }
  }

  countSolutions()
  return solutions === 1
}

// Get density (number of filled cells in row, col, and box)
const getDensity = (board, row, col) => {
  let density = 0

  for (let c = 0; c < 9; c++) if (board[row][c] !== 0) density++
  for (let r = 0; r < 9; r++) if (board[r][col] !== 0) density++

  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (board[r][c] !== 0) density++
    }
  }

  return density
}

// Reduce puzzle via logical method (remove cells with only one possible value)
const reduceLogical = (board, targetCells) => {
  const newBoard = copyBoard(board)
  const cells = []

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (newBoard[r][c] !== 0) cells.push({ row: r, col: c })
    }
  }

  // Shuffle cells
  cells.sort(() => Math.random() - 0.5)

  let removed = 0
  for (const cell of cells) {
    const possibles = getPossibles(newBoard, cell.row, cell.col)
    if (possibles.size === 0) { // Cell has a value, check if removable
      const original = newBoard[cell.row][cell.col]
      newBoard[cell.row][cell.col] = 0
      const newPossibles = getPossibles(newBoard, cell.row, cell.col)
      if (newPossibles.size === 1) {
        removed++
      } else {
        newBoard[cell.row][cell.col] = original
      }
    }
    if (81 - removed <= targetCells) break
  }

  return newBoard
}

// Reduce puzzle via random method with uniqueness check (for hard puzzles)
// Uses hybrid approach: logical first, then limited uniqueness checks
const reduceRandom = (board, targetCells, maxChecks = 15) => {
  // First do logical reduction to get close
  let newBoard = reduceLogical(board, targetCells + 8)

  // Count current filled cells
  let filledCells = 0
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (newBoard[r][c] !== 0) filledCells++
    }
  }

  // If we're already at or below target, return
  if (filledCells <= targetCells) return newBoard

  // Get remaining filled cells sorted by density
  const cells = []
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (newBoard[r][c] !== 0) {
        cells.push({ row: r, col: c, density: getDensity(newBoard, r, c) })
      }
    }
  }
  cells.sort((a, b) => b.density - a.density)

  // Try to remove more cells with uniqueness checking (limited attempts)
  let checks = 0
  for (const cell of cells) {
    if (filledCells <= targetCells || checks >= maxChecks) break

    const original = newBoard[cell.row][cell.col]
    newBoard[cell.row][cell.col] = 0
    checks++

    if (!hasUniqueSolution(newBoard)) {
      newBoard[cell.row][cell.col] = original
    } else {
      filledCells--
    }
  }

  return newBoard
}

// Generate puzzle based on difficulty
const generatePuzzle = (difficulty = 'medium') => {
  // Start with base and randomize
  let puzzle = randomizePuzzle(baseSolvedPuzzle, 100)

  // Define target cells based on difficulty
  // Easy: 38-42 clues, Medium: 30-34 clues, Hard: 22-26 clues, Expert: 17-21 clues
  const targets = {
    easy: { cells: 40, method: 'logical', checks: 0 },
    medium: { cells: 32, method: 'logical', checks: 0 },
    hard: { cells: 22, method: 'hybrid', checks: 25 },
    expert: { cells: 17, method: 'hybrid', checks: 40 },
  }

  const { cells: targetCells, method, checks } = targets[difficulty] || targets.medium

  if (method === 'logical') {
    puzzle = reduceLogical(puzzle, targetCells)
  } else {
    puzzle = reduceRandom(puzzle, targetCells, checks)
  }

  return puzzle
}

// ============= MAIN APP =============

// Create empty notes grid
const createEmptyNotes = () =>
  Array(9).fill(null).map(() =>
    Array(9).fill(null).map(() => new Set())
  )

// Default starting puzzle
const defaultPuzzle = generatePuzzle('medium')

function App() {
  const [puzzle, setPuzzle] = useState(defaultPuzzle)
  const [board, setBoard] = useState(defaultPuzzle)
  const [notes, setNotes] = useState(createEmptyNotes)
  const [autoNotes, setAutoNotes] = useState(createEmptyNotes)
  const [selectedCell, setSelectedCell] = useState(null)
  const [isNotesMode, setIsNotesMode] = useState(false)
  const [history, setHistory] = useState([])
  const [highlightedNumber, setHighlightedNumber] = useState(null)
  const [highlightedCell, setHighlightedCell] = useState(null)
  const [showNewGameMenu, setShowNewGameMenu] = useState(false)
  const [conflictCells, setConflictCells] = useState([])
  const [gameMode, setGameMode] = useState('medium')
  const [showWinModal, setShowWinModal] = useState(false)
  const [isCustomEntryMode, setIsCustomEntryMode] = useState(false)
  const [customBoard, setCustomBoard] = useState(() => 
    Array(9).fill(null).map(() => Array(9).fill(0))
  )

  // Check if placing a number creates a conflict
  const findConflicts = (currentBoard, row, col, num) => {
    const conflicts = []
    
    // Check row
    for (let c = 0; c < 9; c++) {
      if (c !== col && currentBoard[row][c] === num) {
        conflicts.push({ row, col: c })
      }
    }
    
    // Check column
    for (let r = 0; r < 9; r++) {
      if (r !== row && currentBoard[r][col] === num) {
        conflicts.push({ row: r, col })
      }
    }
    
    // Check 3x3 block
    const blockRowStart = Math.floor(row / 3) * 3
    const blockColStart = Math.floor(col / 3) * 3
    for (let r = blockRowStart; r < blockRowStart + 3; r++) {
      for (let c = blockColStart; c < blockColStart + 3; c++) {
        if ((r !== row || c !== col) && currentBoard[r][c] === num) {
          conflicts.push({ row: r, col: c })
        }
      }
    }
    
    return conflicts
  }

  // Flash conflict cells
  const flashConflicts = (cells, includeSelected = true, selectedRow = null, selectedCol = null) => {
    const allConflicts = includeSelected && selectedRow !== null 
      ? [...cells, { row: selectedRow, col: selectedCol }]
      : cells
    setConflictCells(allConflicts)
    setTimeout(() => setConflictCells([]), 600)
  }

  // Start custom puzzle entry mode
  const startCustomEntry = () => {
    setIsCustomEntryMode(true)
    setCustomBoard(Array(9).fill(null).map(() => Array(9).fill(0)))
    setSelectedCell(null)
    setShowNewGameMenu(false)
  }

  // Confirm custom puzzle and start playing
  const confirmCustomPuzzle = () => {
    // Count filled cells
    let filledCount = 0
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (customBoard[r][c] !== 0) filledCount++
      }
    }
    
    if (filledCount < 17) {
      alert('Please enter at least 17 numbers for a valid puzzle.')
      return
    }
    
    const newPuzzle = customBoard.map(row => [...row])
    setPuzzle(newPuzzle)
    setBoard(copyBoard(newPuzzle))
    setNotes(createEmptyNotes())
    setAutoNotes(createEmptyNotes())
    setSelectedCell(null)
    setHistory([])
    setHighlightedNumber(null)
    setHighlightedCell(null)
    setIsCustomEntryMode(false)
    setGameMode('custom')
  }

  // Cancel custom entry
  const cancelCustomEntry = () => {
    setIsCustomEntryMode(false)
    setCustomBoard(Array(9).fill(null).map(() => Array(9).fill(0)))
  }

  // Handle number input in custom entry mode
  const handleCustomNumberInput = (num) => {
    if (!selectedCell) return
    const { row, col } = selectedCell
    
    // Check for conflicts if placing a number
    if (num !== 0) {
      const conflicts = findConflicts(customBoard, row, col, num)
      if (conflicts.length > 0) {
        flashConflicts(conflicts, true, row, col)
      }
    }
    
    setCustomBoard(prev => {
      const newBoard = prev.map(r => [...r])
      newBoard[row][col] = num
      return newBoard
    })
  }

  // Generate new game
  const startNewGame = (difficulty) => {
    const newPuzzle = generatePuzzle(difficulty)
    setPuzzle(newPuzzle)
    setBoard(copyBoard(newPuzzle))
    setNotes(createEmptyNotes())
    setAutoNotes(createEmptyNotes())
    setSelectedCell(null)
    setHistory([])
    setHighlightedNumber(null)
    setHighlightedCell(null)
    setShowNewGameMenu(false)
    setGameMode(difficulty)
    setShowWinModal(false)
  }

  // Reset board to initial puzzle state
  const resetBoard = () => {
    setBoard(copyBoard(puzzle))
    setNotes(createEmptyNotes())
    setAutoNotes(createEmptyNotes())
    setSelectedCell(null)
    setHistory([])
    setHighlightedNumber(null)
    setHighlightedCell(null)
  }

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Custom entry mode keyboard handling
      if (isCustomEntryMode) {
        if (e.key >= '1' && e.key <= '9') {
          const num = parseInt(e.key)
          if (selectedCell) {
            handleCustomNumberInput(num)
          }
        }
        if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
          if (selectedCell) {
            handleCustomNumberInput(0)
          }
        }
        if (e.key === 'Enter') {
          confirmCustomPuzzle()
        }
        if (e.key === 'Escape') {
          cancelCustomEntry()
        }
        // Arrow key navigation in custom mode
        if (selectedCell && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault()
          let { row, col } = selectedCell
          if (e.key === 'ArrowUp' && row > 0) row--
          if (e.key === 'ArrowDown' && row < 8) row++
          if (e.key === 'ArrowLeft' && col > 0) col--
          if (e.key === 'ArrowRight' && col < 8) col++
          setSelectedCell({ row, col })
        }
        return
      }
      
      if (e.key >= '1' && e.key <= '9') {
        const num = parseInt(e.key)
        if (selectedCell) {
          handleNumberInput(num)
        }
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
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        if (selectedCell) {
          if (isNotesMode) {
            // Clear all notes for this cell
            const { row, col } = selectedCell
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
          } else {
            handleNumberInput(0)
          }
        }
      }
      // Toggle notes mode with 'q'
      if (e.key === 'q' || e.key === 'Q') {
        setIsNotesMode(prev => !prev)
      }
      // Reset board with 'r'
      if (e.key === 'r' || e.key === 'R') {
        resetBoard()
      }
      if (selectedCell && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        let { row, col } = selectedCell
        if (e.key === 'ArrowUp' && row > 0) row--
        if (e.key === 'ArrowDown' && row < 8) row++
        if (e.key === 'ArrowLeft' && col > 0) col--
        if (e.key === 'ArrowRight' && col < 8) col++
        setSelectedCell({ row, col })
        // If navigating to an initial cell, highlight that number
        const cellValue = board[row][col]
        if (cellValue !== 0) {
          setHighlightedNumber(cellValue)
          setHighlightedCell({ row, col })
        } else {
          setHighlightedNumber(null)
          setHighlightedCell(null)
        }
      }
      // Escape to close menu
      if (e.key === 'Escape') {
        setShowNewGameMenu(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedCell, highlightedNumber, isNotesMode, puzzle])

  // Get valid candidates for auto-notes
  const getValidCandidates = (currentBoard, row, col) => {
    if (currentBoard[row][col] !== 0) return new Set()
    const candidates = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9])
    for (let c = 0; c < 9; c++) candidates.delete(currentBoard[row][c])
    for (let r = 0; r < 9; r++) candidates.delete(currentBoard[r][col])
    const blockRowStart = Math.floor(row / 3) * 3
    const blockColStart = Math.floor(col / 3) * 3
    for (let r = blockRowStart; r < blockRowStart + 3; r++) {
      for (let c = blockColStart; c < blockColStart + 3; c++) {
        candidates.delete(currentBoard[r][c])
      }
    }
    return candidates
  }

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

  // Check if the puzzle is solved correctly
  const checkWin = (currentBoard) => {
    // Check if all cells are filled
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (currentBoard[row][col] === 0) return false
      }
    }
    
    // Check rows
    for (let row = 0; row < 9; row++) {
      const seen = new Set()
      for (let col = 0; col < 9; col++) {
        const num = currentBoard[row][col]
        if (seen.has(num)) return false
        seen.add(num)
      }
    }
    
    // Check columns
    for (let col = 0; col < 9; col++) {
      const seen = new Set()
      for (let row = 0; row < 9; row++) {
        const num = currentBoard[row][col]
        if (seen.has(num)) return false
        seen.add(num)
      }
    }
    
    // Check 3x3 blocks
    for (let blockRow = 0; blockRow < 3; blockRow++) {
      for (let blockCol = 0; blockCol < 3; blockCol++) {
        const seen = new Set()
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const num = currentBoard[blockRow * 3 + r][blockCol * 3 + c]
            if (seen.has(num)) return false
            seen.add(num)
          }
        }
      }
    }
    
    return true
  }

  const isInHighlightedRegion = (row, col) => {
    if (!highlightedCell) return false
    const sameRow = row === highlightedCell.row
    const sameCol = col === highlightedCell.col
    const sameBlock =
      Math.floor(row / 3) === Math.floor(highlightedCell.row / 3) &&
      Math.floor(col / 3) === Math.floor(highlightedCell.col / 3)
    return sameRow || sameCol || sameBlock
  }

  const handleCellClick = (row, col) => {
    // Custom entry mode - all cells are editable
    if (isCustomEntryMode) {
      setSelectedCell({ row, col })
      return
    }
    
    const cellValue = board[row][col]
    if (cellValue !== 0) {
      if (highlightedNumber === cellValue && highlightedCell?.row === row && highlightedCell?.col === col) {
        setHighlightedNumber(null)
        setHighlightedCell(null)
        setSelectedCell(null)
      } else {
        setHighlightedNumber(cellValue)
        setHighlightedCell({ row, col })
        setSelectedCell(null)
      }
      return
    }
    // Empty cell - highlight region but no number
    setHighlightedNumber(null)
    setHighlightedCell({ row, col })
    if (puzzle[row][col] === 0) {
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
    // Custom entry mode
    if (isCustomEntryMode) {
      handleCustomNumberInput(num)
      return
    }
    
    if (num !== 0 && !isNotesMode) {
      if (highlightedNumber === num) {
        setHighlightedNumber(null)
        setHighlightedCell(null)
      } else {
        setHighlightedNumber(num)
        setHighlightedCell(null)
      }
    }
    handleNumberInput(num)
  }

  const handleNumberInput = (num) => {
    if (!selectedCell) return
    const { row, col } = selectedCell
    saveToHistory()

    if (isNotesMode && num !== 0) {
      const hasManualNote = notes[row][col].has(num)
      const hasAutoNote = autoNotes[row][col].has(num)
      
      // Check for conflicts when adding a note
      if (!hasManualNote && !hasAutoNote) {
        const conflicts = findConflicts(board, row, col, num)
        if (conflicts.length > 0) {
          flashConflicts(conflicts, true, row, col)
        }
      }

      if (hasAutoNote && !hasManualNote) {
        setAutoNotes(prev => {
          const newAutoNotes = prev.map(r => r.map(c => new Set(c)))
          newAutoNotes[row][col].delete(num)
          return newAutoNotes
        })
      } else {
        setNotes(prev => {
          const newNotes = prev.map(r => r.map(c => new Set(c)))
          if (newNotes[row][col].has(num)) {
            newNotes[row][col].delete(num)
          } else {
            newNotes[row][col].add(num)
          }
          return newNotes
        })
        if (!hasManualNote) {
          setAutoNotes(prev => {
            const newAutoNotes = prev.map(r => r.map(c => new Set(c)))
            newAutoNotes[row][col].delete(num)
            return newAutoNotes
          })
        }
      }
    } else {
      // Check for conflicts when placing a number
      if (num !== 0) {
        const conflicts = findConflicts(board, row, col, num)
        if (conflicts.length > 0) {
          flashConflicts(conflicts, true, row, col)
        }
      }
      
      const newBoard = board.map((r, rowIndex) =>
        r.map((cell, colIndex) =>
          rowIndex === row && colIndex === col ? num : cell
        )
      )
      setBoard(newBoard)
      
      // Check for win
      if (num !== 0 && checkWin(newBoard)) {
        setTimeout(() => setShowWinModal(true), 300)
      }
      
      if (num !== 0) {
        // Clear notes for this cell and remove from related cells
        const removeNoteFromRelatedCells = (notesGrid) => {
          const newNotes = notesGrid.map(r => r.map(c => new Set(c)))
          // Clear the cell itself
          newNotes[row][col].clear()
          
          // Remove from same row
          for (let c = 0; c < 9; c++) {
            newNotes[row][c].delete(num)
          }
          
          // Remove from same column
          for (let r = 0; r < 9; r++) {
            newNotes[r][col].delete(num)
          }
          
          // Remove from same 3x3 block
          const blockRowStart = Math.floor(row / 3) * 3
          const blockColStart = Math.floor(col / 3) * 3
          for (let r = blockRowStart; r < blockRowStart + 3; r++) {
            for (let c = blockColStart; c < blockColStart + 3; c++) {
              newNotes[r][c].delete(num)
            }
          }
          
          return newNotes
        }
        
        setNotes(prev => removeNoteFromRelatedCells(prev))
        setAutoNotes(prev => removeNoteFromRelatedCells(prev))
      }
    }
  }

  const isInitialCell = (row, col) => puzzle[row][col] !== 0

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

  const cellHasNotes = (row, col) => {
    return notes[row][col].size > 0 || autoNotes[row][col].size > 0
  }

  // Count how many times each number appears on the board
  const getNumberCounts = () => {
    const counts = {}
    for (let num = 1; num <= 9; num++) {
      counts[num] = 0
    }
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const num = board[row][col]
        if (num !== 0) {
          counts[num]++
        }
      }
    }
    return counts
  }

  const numberCounts = getNumberCounts()

  return (
    <div className="container">
      <h1 className="title">{isCustomEntryMode ? 'Enter Your Puzzle' : 'Sudoku'}</h1>
      {!isCustomEntryMode && (
        <div className="sub-header">
          <div className="new-game-wrapper">
            <button
              className="header-btn"
              onClick={() => setShowNewGameMenu(!showNewGameMenu)}
              title="New Game"
            >
              <i className="fa-solid fa-plus"></i> NEW
            </button>
            {showNewGameMenu && (
              <div className="new-game-dropdown">
                <button onClick={() => startNewGame('easy')}>Easy</button>
                <button onClick={() => startNewGame('medium')}>Medium</button>
                <button onClick={() => startNewGame('hard')}>Hard</button>
                <button onClick={() => startNewGame('expert')}>Expert</button>
                <button onClick={startCustomEntry}>Custom</button>
              </div>
            )}
          </div>
          <div className={`game-mode ${gameMode}`}>
            {gameMode.charAt(0).toUpperCase() + gameMode.slice(1)}
          </div>
          <button
            className="header-btn"
            onClick={resetBoard}
            title="Reset Board"
          >
            <i className="fa-solid fa-rotate-right"></i> RESET
          </button>
        </div>
      )}

      <div className="board">
        {(isCustomEntryMode ? customBoard : board).map((row, rowIndex) => (
          <div key={rowIndex} className="row">
            {row.map((cell, colIndex) => (
              <div
                key={colIndex}
                className={`cell
                  ${isCustomEntryMode ? 'custom-entry' : (isInitialCell(rowIndex, colIndex) ? 'initial' : 'editable')}
                  ${selectedCell?.row === rowIndex && selectedCell?.col === colIndex ? 'selected' : ''}
                  ${!isCustomEntryMode && highlightedCell?.row === rowIndex && highlightedCell?.col === colIndex ? 'clicked-cell' : ''}
                  ${colIndex % 3 === 2 && colIndex !== 8 ? 'border-right' : ''}
                  ${rowIndex % 3 === 2 && rowIndex !== 8 ? 'border-bottom' : ''}
                  ${!isCustomEntryMode && cellHasNotes(rowIndex, colIndex) && cell === 0 ? 'has-notes' : ''}
                  ${!isCustomEntryMode && cell !== 0 && highlightedNumber === cell ? 'cell-highlighted' : ''}
                  ${!isCustomEntryMode && isInHighlightedRegion(rowIndex, colIndex) ? 'region-highlighted' : ''}
                  ${conflictCells.some(c => c.row === rowIndex && c.col === colIndex) ? 'conflict' : ''}
                `}
                onClick={() => handleCellClick(rowIndex, colIndex)}
              >
                {isCustomEntryMode ? (cell !== 0 ? cell : '') : renderCellContent(rowIndex, colIndex, cell)}
              </div>
            ))}
          </div>
        ))}
      </div>

      {!isCustomEntryMode && (
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
      )}

      
      {isCustomEntryMode && (
        <div className="custom-entry-controls">
          <button onClick={confirmCustomPuzzle} className="confirm-btn">
            <i className="fa-solid fa-check"></i> Start Playing
          </button>
          <button onClick={cancelCustomEntry} className="cancel-btn">
            <i className="fa-solid fa-xmark"></i> Cancel
          </button>
        </div>
      )}

      <div className="number-pad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          const isComplete = !isCustomEntryMode && numberCounts[num] >= 9
          return (
            <button
              key={num}
              className={`number-btn ${!isCustomEntryMode && highlightedNumber === num ? 'active' : ''} ${isComplete ? 'complete' : ''}`}
              onClick={() => handleNumberPadClick(num)}
              disabled={isComplete}
            >
              {num}
            </button>
          )
        })}
      </div>

      {showWinModal && (
        <div className="win-modal-overlay" onClick={() => setShowWinModal(false)}>
          <div className="win-modal" onClick={(e) => e.stopPropagation()}>
            <div className="win-icon">🎉</div>
            <h2>Congratulations!</h2>
            <p>You solved the puzzle!</p>
            <button 
              className="win-btn"
              onClick={() => {
                setShowWinModal(false)
                setShowNewGameMenu(true)
              }}
            >
              New Game
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
