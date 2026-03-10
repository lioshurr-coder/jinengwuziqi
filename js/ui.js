// UI management for Skill Gomoku

class UIManager {
    constructor(game) {
        this.game = game;
        this.screens = {
            setup: document.getElementById('setup-screen'),
            game: document.getElementById('game-screen'),
            result: document.getElementById('result-screen')
        };
        
        // Setup screen elements
        this.setupElements = {
            player1Name: document.getElementById('player1-name'),
            player2Name: document.getElementById('player2-name'),
            startBtn: document.getElementById('start-game-btn'),
            avatarOptions: document.querySelectorAll('.avatar-option')
        };
        
        // Game screen elements
        this.gameElements = {
            timerText: document.getElementById('timer-text'),
            currentPlayerName: document.getElementById('current-player-name'),
            player1Avatar: document.getElementById('player1-avatar-display'),
            player1Name: document.getElementById('player1-name-display'),
            player2Avatar: document.getElementById('player2-avatar-display'),
            player2Name: document.getElementById('player2-name-display'),
            player1Skills: document.getElementById('player1-skills'),
            player2Skills: document.getElementById('player2-skills'),
            skillDescription: document.getElementById('skill-description'),
            player1Panel: document.querySelector('.player1-panel'),
            player2Panel: document.querySelector('.player2-panel')
        };
        
        // Result screen elements
        this.resultElements = {
            winnerAvatar: document.getElementById('winner-avatar'),
            winnerName: document.getElementById('winner-name'),
            playAgainBtn: document.getElementById('play-again-btn'),
            backToSetupBtn: document.getElementById('back-to-setup-btn')
        };
        
        this.selectedAvatars = [1, 6];
        
        this.initEventListeners();
    }
    
    initEventListeners() {
        // Avatar selection
        this.setupElements.avatarOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const avatarId = parseInt(e.target.dataset.avatar);
                const parent = e.target.closest('.player-setup');
                const isPlayer1 = parent.classList.contains('player1-setup');
                
                parent.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
                e.target.classList.add('selected');
                
                if (isPlayer1) {
                    this.selectedAvatars[0] = avatarId;
                } else {
                    this.selectedAvatars[1] = avatarId;
                }
            });
        });
        
        // Start game button
        this.setupElements.startBtn.addEventListener('click', () => {
            const player1Name = this.setupElements.player1Name.value.trim() || '玩家一';
            const player2Name = this.setupElements.player2Name.value.trim() || '玩家二';
            
            this.game.startGame(player1Name, player2Name, this.selectedAvatars);
        });
        
        // Result screen buttons
        this.resultElements.playAgainBtn.addEventListener('click', () => {
            this.game.resetGame();
        });
        
        this.resultElements.backToSetupBtn.addEventListener('click', () => {
            this.showScreen('setup');
        });
    }
    
    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
        this.screens[screenName].classList.add('active');
    }
    
    updateTimer(seconds) {
        this.gameElements.timerText.textContent = seconds;
        
        if (seconds <= 3) {
            this.gameElements.timerText.style.color = '#ff4444';
        } else {
            this.gameElements.timerText.style.color = '#ffd700';
        }
    }
    
    updateCurrentPlayer(playerIndex) {
        const player = this.game.players[playerIndex];
        this.gameElements.currentPlayerName.textContent = player.name;
        
        this.gameElements.player1Panel.classList.toggle('active', playerIndex === 0);
        this.gameElements.player2Panel.classList.toggle('active', playerIndex === 1);
    }
    
    updatePlayerDisplays() {
        const p1 = this.game.players[0];
        const p2 = this.game.players[1];
        
        this.gameElements.player1Avatar.textContent = p1.avatar;
        this.gameElements.player1Name.textContent = p1.name;
        this.gameElements.player2Avatar.textContent = p2.avatar;
        this.gameElements.player2Name.textContent = p2.name;
    }
    
    updatePlayerColors() {
        const p1ColorEl = document.querySelector('.player1-panel .player-color');
        const p2ColorEl = document.querySelector('.player2-panel .player-color');
        
        if (this.game.players[0].color === 'black') {
            p1ColorEl.textContent = '黑棋';
            p1ColorEl.className = 'player-color black-stone';
            p2ColorEl.textContent = '白棋';
            p2ColorEl.className = 'player-color white-stone';
        } else {
            p1ColorEl.textContent = '白棋';
            p1ColorEl.className = 'player-color white-stone';
            p2ColorEl.textContent = '黑棋';
            p2ColorEl.className = 'player-color black-stone';
        }
    }
    
    updateSkillCards() {
        this.renderSkillCards(0);
        this.renderSkillCards(1);
    }
    
    renderSkillCards(playerIndex) {
        const container = playerIndex === 0 ? this.gameElements.player1Skills : this.gameElements.player2Skills;
        const player = this.game.players[playerIndex];
        const isCurrentPlayer = this.game.currentPlayer === playerIndex;
        
        container.innerHTML = '';
        
        player.getAllSkills().forEach((skill, index) => {
            const card = document.createElement('div');
            card.className = 'skill-card';
            if (!isCurrentPlayer) {
                card.classList.add('disabled');
            }
            card.textContent = skill.name;
            card.dataset.skillIndex = index;
            
            if (isCurrentPlayer) {
                card.addEventListener('click', () => {
                    this.handleSkillCardClick(playerIndex, index, card);
                });
            }
            
            container.appendChild(card);
        });
    }
    
    handleSkillCardClick(playerIndex, skillIndex, cardEl) {
        // Check if already in skill selection mode
        if (this.game.skillManager.pendingSkill) {
            this.game.skillManager.cancelPendingSkill();
            document.querySelectorAll('.skill-card').forEach(c => c.classList.remove('selected'));
            return;
        }
        
        // Check if it's this player's turn
        if (this.game.currentPlayer !== playerIndex) {
            return;
        }
        
        // Check if game is in skill selection mode
        if (this.game.state !== 'playing') {
            return;
        }
        
        // Mark as selected
        document.querySelectorAll('.skill-card').forEach(c => c.classList.remove('selected'));
        cardEl.classList.add('selected');
        
        // Activate skill
        this.game.skillManager.activateSkill(playerIndex, skillIndex);
    }
    
    showSkillDescription(skill) {
        this.gameElements.skillDescription.textContent = skill.description;
        this.gameElements.skillDescription.classList.add('show');
        
        setTimeout(() => {
            this.gameElements.skillDescription.classList.remove('show');
        }, 3000);
    }
    
    showMessage(message, duration = 2000) {
        // Create temporary message overlay
        const msgEl = document.createElement('div');
        msgEl.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: #ffd700;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 1.2rem;
            z-index: 1000;
            border: 2px solid #ffd700;
            text-align: center;
        `;
        document.body.appendChild(msgEl);
        
        setTimeout(() => {
            msgEl.remove();
        }, duration);
    }
    
    showResult(winner) {
        this.resultElements.winnerAvatar.textContent = winner.avatar;
        this.resultElements.winnerName.textContent = winner.name;
        this.showScreen('result');
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIManager };
}