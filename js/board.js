// Board management for Skill Gomoku

// Cell states
const CELL_STATE = {
    EMPTY: 0,
    BLACK: 1,
    WHITE: 2,
    WATER: 3,      // 水到渠成 - water flow
    CRATER: 4,     // 智库报告 - crater after explosion
    BADMINTON: 5   // 打羽毛球 - badminton shuttlecock
};

class Board {
    constructor(size = 15) {
        this.size = size;
        this.grid = [];
        this.waterZones = [];  // {row, col, remainingTurns}
        this.craters = [];     // {row, col, remainingTurns}
        this.badmintons = [];  // {row, col}
        this.reset();
    }
    
    reset() {
        this.grid = Array(this.size).fill(null).map(() => Array(this.size).fill(CELL_STATE.EMPTY));
        this.waterZones = [];
        this.craters = [];
        this.badmintons = [];
    }
    
    // Get cell state at position
    getCell(row, col) {
        if (!isValidPosition(row, col, this.size)) return null;
        return this.grid[row][col];
    }
    
    // Set cell state
    setCell(row, col, state) {
        if (!isValidPosition(row, col, this.size)) return false;
        this.grid[row][col] = state;
        return true;
    }
    
    // Check if cell is empty (can place piece)
    isEmpty(row, col) {
        const cell = this.getCell(row, col);
        return cell === CELL_STATE.EMPTY;
    }
    
    // Check if cell is playable (not blocked by water, crater, or badminton)
    isPlayable(row, col) {
        if (!isValidPosition(row, col, this.size)) return false;
        const cell = this.getCell(row, col);
        return cell === CELL_STATE.EMPTY || cell === CELL_STATE.BLACK || cell === CELL_STATE.WHITE;
    }
    
    // Place a piece
    placePiece(row, col, color) {
        if (!this.isEmpty(row, col)) return false;
        this.grid[row][col] = color === 'black' ? CELL_STATE.BLACK : CELL_STATE.WHITE;
        return true;
    }
    
    // Remove a piece
    removePiece(row, col) {
        if (!isValidPosition(row, col, this.size)) return false;
        this.grid[row][col] = CELL_STATE.EMPTY;
        return true;
    }
    
    // Get all pieces of a color
    getPieces(color) {
        const state = color === 'black' ? CELL_STATE.BLACK : CELL_STATE.WHITE;
        const pieces = [];
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col] === state) {
                    pieces.push({ row, col });
                }
            }
        }
        return pieces;
    }
    
    // Get all pieces (both colors)
    getAllPieces() {
        const pieces = [];
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col] === CELL_STATE.BLACK || this.grid[row][col] === CELL_STATE.WHITE) {
                    pieces.push({ row, col, color: this.grid[row][col] === CELL_STATE.BLACK ? 'black' : 'white' });
                }
            }
        }
        return pieces;
    }
    
    // Check if there are any pieces on board
    hasPieces() {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col] === CELL_STATE.BLACK || this.grid[row][col] === CELL_STATE.WHITE) {
                    return true;
                }
            }
        }
        return false;
    }
    
    // Check if specific color has pieces
    hasColorPieces(color) {
        const state = color === 'black' ? CELL_STATE.BLACK : CELL_STATE.WHITE;
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col] === state) {
                    return true;
                }
            }
        }
        return false;
    }
    
    // Swap all piece colors
    swapColors() {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col] === CELL_STATE.BLACK) {
                    this.grid[row][col] = CELL_STATE.WHITE;
                } else if (this.grid[row][col] === CELL_STATE.WHITE) {
                    this.grid[row][col] = CELL_STATE.BLACK;
                }
            }
        }
    }
    
    // Add water zone
    addWaterZone(cells) {
        cells.forEach(({ row, col }) => {
            if (isValidPosition(row, col, this.size)) {
                this.waterZones.push({ row, col, remainingTurns: 6 }); // 3 turns per player
                this.grid[row][col] = CELL_STATE.WATER;
            }
        });
    }
    
    // Add crater
    addCrater(row, col) {
        if (isValidPosition(row, col, this.size)) {
            this.craters.push({ row, col, remainingTurns: 6 }); // 3 turns per player
            this.grid[row][col] = CELL_STATE.CRATER;
        }
    }
    
    // Add badminton
    addBadminton(row, col) {
        if (isValidPosition(row, col, this.size)) {
            this.badmintons.push({ row, col });
            this.grid[row][col] = CELL_STATE.BADMINTON;
        }
    }
    
    // Update temporary zones (decrement turns)
    updateTemporaryZones() {
        // Update water zones
        this.waterZones = this.waterZones.filter(zone => {
            zone.remainingTurns--;
            if (zone.remainingTurns <= 0) {
                this.grid[zone.row][zone.col] = CELL_STATE.EMPTY;
                return false;
            }
            return true;
        });
        
        // Update craters
        this.craters = this.craters.filter(crater => {
            crater.remainingTurns--;
            if (crater.remainingTurns <= 0) {
                this.grid[crater.row][crater.col] = CELL_STATE.EMPTY;
                return false;
            }
            return true;
        });
    }
    
    // Check win condition (5 in a row)
    checkWin(row, col) {
        const color = this.grid[row][col];
        if (color !== CELL_STATE.BLACK && color !== CELL_STATE.WHITE) {
            return false;
        }
        
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal \
            [1, -1]   // diagonal /
        ];
        
        for (const [dr, dc] of directions) {
            let count = 1;
            
            // Check positive direction
            for (let i = 1; i < 5; i++) {
                const newRow = row + dr * i;
                const newCol = col + dc * i;
                if (isValidPosition(newRow, newCol, this.size) && this.grid[newRow][newCol] === color) {
                    count++;
                } else {
                    break;
                }
            }
            
            // Check negative direction
            for (let i = 1; i < 5; i++) {
                const newRow = row - dr * i;
                const newCol = col - dc * i;
                if (isValidPosition(newRow, newCol, this.size) && this.grid[newRow][newCol] === color) {
                    count++;
                } else {
                    break;
                }
            }
            
            if (count >= 5) {
                return true;
            }
        }
        
        return false;
    }
    
    // Get winning line (for highlighting)
    getWinningLine(row, col) {
        const color = this.grid[row][col];
        if (color !== CELL_STATE.BLACK && color !== CELL_STATE.WHITE) {
            return [];
        }
        
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal \
            [1, -1]   // diagonal /
        ];
        
        for (const [dr, dc] of directions) {
            let line = [{ row, col }];
            
            // Check positive direction
            for (let i = 1; i < 5; i++) {
                const newRow = row + dr * i;
                const newCol = col + dc * i;
                if (isValidPosition(newRow, newCol, this.size) && this.grid[newRow][newCol] === color) {
                    line.push({ row: newRow, col: newCol });
                } else {
                    break;
                }
            }
            
            // Check negative direction
            for (let i = 1; i < 5; i++) {
                const newRow = row - dr * i;
                const newCol = col - dc * i;
                if (isValidPosition(newRow, newCol, this.size) && this.grid[newRow][newCol] === color) {
                    line.push({ row: newRow, col: newCol });
                } else {
                    break;
                }
            }
            
            if (line.length >= 5) {
                return line;
            }
        }
        
        return [];
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Board, CELL_STATE };
}
