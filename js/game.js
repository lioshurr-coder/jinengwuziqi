// Main game logic for Skill Gomoku

class Game {
    constructor() {
        this.board = new Board(15);
        this.players = [];
        this.currentPlayer = 0;
        this.turnCount = 0;
        this.timer = 10;
        this.timerInterval = null;
        this.state = 'setup'; // setup, playing, ended
        this.winner = null;
        
        this.ui = new UIManager(this);
        this.renderer = new BoardRenderer(this);
        this.skillManager = new SkillManager(this);
        this.sharkManager = new SharkManager(this);
        
        this.lastTime = Date.now();
        this.gameLoopId = null;
    }
    
    startGame(player1Name, player2Name, avatarIds) {
        // Get avatar emojis based on IDs
        const avatars = {
            1: '🐼', 2: '🐯', 3: '🐲', 4: '🦅',
            5: '🦊', 6: '🐺', 7: '🦉', 8: '🐍'
        };
        
        // Create players
        this.players = [
            new Player(0, player1Name, avatars[avatarIds[0]], 'black'),
            new Player(1, player2Name, avatars[avatarIds[1]], 'white')
        ];
        
        // Give initial skills
        this.players.forEach(p => p.giveInitialSkill());
        
        // Reset game state
        this.board.reset();
        this.currentPlayer = 0;
        this.turnCount = 0;
        this.timer = 10;
        this.state = 'playing';
        this.winner = null;
        
        // Update UI
        this.ui.showScreen('game');
        this.ui.updatePlayerDisplays();
        this.ui.updatePlayerColors();
        this.ui.updateCurrentPlayer(0);
        this.ui.updateSkillCards();
        this.renderer.drawBoard();
        
        // Start game loop
        this.startGameLoop();
        this.startTimer();
        
        // Update lake animation
        this.updateLake();
    }
    
    startGameLoop() {
        this.lastTime = Date.now();
        const loop = () => {
            if (this.state !== 'playing') return;
            
            const now = Date.now();
            const deltaTime = (now - this.lastTime) / 1000;
            this.lastTime = now;
            
            // Update shark
            this.sharkManager.update();
            
            // Update lake animation
            this.updateLake();
            
            this.gameLoopId = requestAnimationFrame(loop);
        };
        this.gameLoopId = requestAnimationFrame(loop);
    }
    
    updateLake() {
        const lakeCanvas = document.getElementById('lake-canvas');
        if (lakeCanvas) {
            const ctx = lakeCanvas.getContext('2d');
            this.sharkManager.drawLake(ctx, lakeCanvas.width, lakeCanvas.height);
        }
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.state !== 'playing') return;
            
            this.timer--;
            this.ui.updateTimer(this.timer);
            
            if (this.timer <= 0) {
                this.endTurn();
            }
        }, 1000);
    }
    
    placePiece(row, col) {
        if (this.state !== 'playing') return;
        
        // Check if in skill selection mode
        if (this.skillManager.pendingSkill) {
            return;
        }
        
        const player = this.players[this.currentPlayer];
        const color = player.color;
        
        // Try to place piece
        if (this.board.placePiece(row, col, color)) {
            this.renderer.drawBoard();
            
            // Check win condition
            if (this.board.checkWin(row, col)) {
                this.endGame(player);
                return;
            }
            
            this.endTurn();
        }
    }
    
    endTurn() {
        // Update temporary zones (water, craters)
        this.board.updateTemporaryZones();
        
        // Switch player
        this.currentPlayer = this.currentPlayer === 0 ? 1 : 0;
        this.turnCount++;
        this.timer = 10;
        
        // Give skill card every 4 turns
        if (this.turnCount % 4 === 0) {
            this.players.forEach(p => {
                if (p.canAddSkill()) {
                    p.addRandomSkill();
                }
            });
        }
        
        // Update UI
        this.ui.updateCurrentPlayer(this.currentPlayer);
        this.ui.updateTimer(this.timer);
        this.ui.updateSkillCards();
        this.renderer.drawBoard();
        
        // Clear any pending skill
        this.skillManager.pendingSkill = null;
        this.skillManager.pendingTargetMode = null;
        document.querySelectorAll('.skill-card').forEach(c => c.classList.remove('selected'));
    }
    
    endGame(winner) {
        this.state = 'ended';
        this.winner = winner;
        
        // Stop timers
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        
        // Show result
        setTimeout(() => {
            this.ui.showResult(winner);
        }, 500);
    }
    
    resetBoard() {
        // Reset board but keep players and skills
        this.board.reset();
        this.currentPlayer = 0;
        this.turnCount = 0;
        this.timer = 10;
        this.state = 'playing';
        
        // Reset shark
        this.sharkManager.reset();
        
        // Update UI
        this.ui.updateCurrentPlayer(0);
        this.ui.updateTimer(this.timer);
        this.renderer.drawBoard();
        
        // Restart timers
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.startTimer();
    }
    
    resetGame() {
        // Full reset - go back to setup
        this.state = 'setup';
        this.board.reset();
        this.players = [];
        this.currentPlayer = 0;
        this.turnCount = 0;
        this.timer = 10;
        this.winner = null;
        
        // Stop timers
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        
        // Reset shark
        this.sharkManager.reset();
        
        // Show setup screen
        this.ui.showScreen('setup');
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Game };
}
