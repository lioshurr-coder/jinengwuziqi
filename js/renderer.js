// Board renderer for Skill Gomoku

class BoardRenderer {
    constructor(game) {
        this.game = game;
        this.canvas = document.getElementById('game-board');
        this.ctx = this.canvas.getContext('2d');
        this.size = 15;
        this.cellSize = 36;
        this.margin = 30;
        this.boardSize = this.cellSize * (this.size - 1);
        
        this.highlightedCells = [];
        this.hoverCell = null;
        
        this.initEventListeners();
    }
    
    initEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // Right-click to cancel skill
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.game.skillManager.cancelPendingSkill();
        });
        
        // Lake mousedown for water flow skill
        const lakeCanvas = document.getElementById('lake-canvas');
        if (lakeCanvas) {
            lakeCanvas.addEventListener('mousedown', (e) => this.handleLakeMouseDown(e));
        }
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    getCellFromPos(x, y) {
        const col = Math.round((x - this.margin) / this.cellSize);
        const row = Math.round((y - this.margin) / this.cellSize);
        
        if (isValidPosition(row, col, this.size)) {
            return { row, col };
        }
        return null;
    }
    
    handleMouseMove(e) {
        const pos = this.getMousePos(e);
        const cell = this.getCellFromPos(pos.x, pos.y);
        
        if (cell && (this.hoverCell?.row !== cell.row || this.hoverCell?.col !== cell.col)) {
            this.hoverCell = cell;
            this.drawBoard();
        } else if (!cell && this.hoverCell) {
            this.hoverCell = null;
            this.drawBoard();
        }
    }
    
    handleMouseLeave() {
        this.hoverCell = null;
        this.drawBoard();
    }
    
    handleClick(e) {
        const pos = this.getMousePos(e);
        const cell = this.getCellFromPos(pos.x, pos.y);
        
        if (!cell) return;
        
        const { row, col } = cell;
        
        // Check if we're in skill target selection mode
        const skillManager = this.game.skillManager;
        
        if (skillManager.pendingTargetMode) {
            switch (skillManager.pendingTargetMode) {
                case 'throw_to_lake':
                    // Check if clicked on opponent piece
                    const opponentColor = this.game.currentPlayer === 0 ? 'white' : 'black';
                    const piece = this.game.board.getCell(row, col);
                    const opponentState = opponentColor === 'black' ? CELL_STATE.BLACK : CELL_STATE.WHITE;
                    
                    if (piece === opponentState) {
                        skillManager.executeRengJinShiChaHai(row, col);
                    }
                    break;
                    
                case 'select_badminton':
                    // Check if clicked on opponent piece
                    const oppColor = this.game.currentPlayer === 0 ? 'white' : 'black';
                    const p = this.game.board.getCell(row, col);
                    const oppState = oppColor === 'black' ? CELL_STATE.BLACK : CELL_STATE.WHITE;
                    
                    if (p === oppState) {
                        skillManager.executeDaYuMaoQiu(row, col);
                    }
                    break;
                    
                case 'water_flow':
                    // Water flow mode - need drag from lake to board
                    // This is handled differently (drag from lake)
                    break;
            }
            return;
        }
        
        // Normal piece placement
        if (this.game.state === 'playing' && this.game.board.isEmpty(row, col)) {
            this.game.placePiece(row, col);
        }
    }
    
    handleMouseDown(e) {
        // Handle water flow drag end on board
        if (this.game.skillManager.pendingTargetMode === 'water_flow' && 
            this.game.skillManager.waterFlowStart) {
            const pos = this.getMousePos(e);
            const cell = this.getCellFromPos(pos.x, pos.y);
            
            if (cell) {
                const start = this.game.skillManager.waterFlowStart;
                this.game.skillManager.executeShuiDaoQuCheng(
                    start.row, start.col, cell.row, cell.col
                );
                this.game.skillManager.waterFlowStart = null;
            }
        }
    }
    
    handleMouseUp(e) {
        // Cleanup if needed
    }
    
    handleLakeMouseDown(e) {
        if (this.game.skillManager.pendingTargetMode === 'water_flow') {
            // Start water flow from lake
            // Use bottom center of board as start point
            this.game.skillManager.waterFlowStart = { row: 14, col: 7 };
            this.game.ui.showMessage('现在拖拽到棋盘上的目标位置！', 2000);
        }
    }
    
    drawBoard() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw board background
        ctx.fillStyle = '#D4A574';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw wood texture effect
        ctx.strokeStyle = 'rgba(139, 69, 19, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += 20) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.stroke();
        }
        
        // Draw grid lines
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < this.size; i++) {
            // Vertical lines
            ctx.beginPath();
            ctx.moveTo(this.margin + i * this.cellSize, this.margin);
            ctx.lineTo(this.margin + i * this.cellSize, this.margin + this.boardSize);
            ctx.stroke();
            
            // Horizontal lines
            ctx.beginPath();
            ctx.moveTo(this.margin, this.margin + i * this.cellSize);
            ctx.lineTo(this.margin + this.boardSize, this.margin + i * this.cellSize);
            ctx.stroke();
        }
        
        // Draw star points (for 15x15 board: positions 3, 7, 11)
        const starPoints = [3, 7, 11];
        ctx.fillStyle = '#8B4513';
        for (const row of starPoints) {
            for (const col of starPoints) {
                ctx.beginPath();
                ctx.arc(
                    this.margin + col * this.cellSize,
                    this.margin + row * this.cellSize,
                    4, 0, Math.PI * 2
                );
                ctx.fill();
            }
        }
        
        // Draw cells
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                this.drawCell(row, col);
            }
        }
        
        // Draw hover effect
        if (this.hoverCell && this.game.state === 'playing') {
            const { row, col } = this.hoverCell;
            if (this.game.board.isEmpty(row, col)) {
                const x = this.margin + col * this.cellSize;
                const y = this.margin + row * this.cellSize;
                
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(x, y, this.cellSize * 0.4, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        }
        
        // Draw highlighted cells
        this.highlightedCells.forEach(({ row, col, color }) => {
            const x = this.margin + col * this.cellSize;
            const y = this.margin + row * this.cellSize;
            
            ctx.save();
            ctx.strokeStyle = color || '#ffd700';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, y, this.cellSize * 0.45, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        });
        
        // Draw water flow drag line
        if (this.game.skillManager.pendingTargetMode === 'water_flow' && 
            this.game.skillManager.waterFlowStart && this.hoverCell) {
            const startX = this.margin + this.game.skillManager.waterFlowStart.col * this.cellSize;
            const startY = this.margin + this.game.skillManager.waterFlowStart.row * this.cellSize;
            const endX = this.margin + this.hoverCell.col * this.cellSize;
            const endY = this.margin + this.hoverCell.row * this.cellSize;
            
            ctx.save();
            ctx.strokeStyle = 'rgba(30, 144, 255, 0.8)';
            ctx.lineWidth = 4;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            ctx.restore();
        }
    }
    
    drawCell(row, col) {
        const ctx = this.ctx;
        const cell = this.game.board.getCell(row, col);
        const x = this.margin + col * this.cellSize;
        const y = this.margin + row * this.cellSize;
        
        switch (cell) {
            case CELL_STATE.BLACK:
                this.drawPiece(x, y, '#1a1a1a', true);
                break;
            case CELL_STATE.WHITE:
                this.drawPiece(x, y, '#f5f5f5', false);
                break;
            case CELL_STATE.WATER:
                this.drawWater(x, y, row, col);
                break;
            case CELL_STATE.CRATER:
                this.drawCrater(x, y);
                break;
            case CELL_STATE.BADMINTON:
                this.drawBadminton(x, y);
                break;
        }
    }
    
    drawPiece(x, y, color, isBlack) {
        const ctx = this.ctx;
        const radius = this.cellSize * 0.38;
        
        // Shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // Main piece
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        
        // Gradient for 3D effect
        const gradient = ctx.createRadialGradient(
            x - radius * 0.3, y - radius * 0.3, 0,
            x, y, radius
        );
        
        if (isBlack) {
            gradient.addColorStop(0, '#444');
            gradient.addColorStop(0.3, '#1a1a1a');
            gradient.addColorStop(1, '#000');
        } else {
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(0.3, '#f5f5f5');
            gradient.addColorStop(1, '#ccc');
        }
        
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();
        
        // Border
        ctx.strokeStyle = isBlack ? '#000' : '#999';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    drawWater(x, y, row, col) {
        const ctx = this.ctx;
        const time = Date.now() * 0.003;
        const waveOffset = Math.sin(time + row * 0.5 + col * 0.3) * 3;
        
        ctx.save();
        ctx.fillStyle = `rgba(30, 144, 255, 0.7)`;
        ctx.fillRect(x - this.cellSize / 2, y - this.cellSize / 2, this.cellSize, this.cellSize);
        
        // Wave lines
        ctx.strokeStyle = `rgba(100, 200, 255, 0.5)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - this.cellSize / 2, y + waveOffset);
        ctx.lineTo(x + this.cellSize / 2, y + waveOffset);
        ctx.stroke();
        ctx.restore();
    }
    
    drawCrater(x, y) {
        const ctx = this.ctx;
        const radius = this.cellSize * 0.4;
        
        ctx.save();
        
        // Crater gradient (dark hole)
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, '#1a1a1a');
        gradient.addColorStop(0.7, '#333');
        gradient.addColorStop(1, '#444');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Crater rim
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
    
    drawBadminton(x, y) {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.font = '1.8rem Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏸', x, y);
        ctx.restore();
    }
    
    // Highlight specific pieces
    highlightPieces(pieces, color = '#ffd700') {
        this.highlightedCells = pieces.map(p => ({ row: p.row, col: p.col, color }));
        this.drawBoard();
    }
    
    // Clear highlights
    clearHighlights() {
        this.highlightedCells = [];
        this.drawBoard();
    }
    
    // Highlight lake area
    highlightLake() {
        const lakeSection = document.querySelector('.lake-section');
        lakeSection.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.6)';
        
        setTimeout(() => {
            lakeSection.style.boxShadow = '';
        }, 3000);
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BoardRenderer };
}
