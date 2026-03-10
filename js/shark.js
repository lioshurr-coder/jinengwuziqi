// Shark mechanic for Shichahai lake

class SharkManager {
    constructor(game) {
        this.game = game;
        this.state = 'idle'; // idle, warning, jumping, eating
        this.timer = 0;
        this.warningThreshold = 17; // Start warning at 17 seconds
        this.jumpThreshold = 20;    // Jump at 20 seconds
        this.lastUpdate = Date.now();
        
        // Shark element
        this.sharkEl = document.getElementById('shark');
        this.warningEl = document.getElementById('lake-warning');
        
        // Animation states
        this.bobOffset = 0;
        this.bobDirection = 1;
    }
    
    update() {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;
        
        this.timer += deltaTime;
        
        // Idle bobbing animation
        if (this.state === 'idle') {
            this.bobOffset += 0.05 * this.bobDirection;
            if (Math.abs(this.bobOffset) > 5) {
                this.bobDirection *= -1;
            }
            this.sharkEl.style.transform = `translate(-50%, calc(-50% + ${this.bobOffset}px))`;
        }
        
        // Check warning threshold
        if (this.state === 'idle' && this.timer >= this.warningThreshold) {
            this.startWarning();
        }
        
        // Check jump threshold
        if ((this.state === 'idle' || this.state === 'warning') && this.timer >= this.jumpThreshold) {
            this.jump();
        }
    }
    
    startWarning() {
        this.state = 'warning';
        this.warningEl.classList.add('show');
        
        // Shark gets agitated
        this.sharkEl.style.transition = 'transform 0.1s ease';
        this.sharkEl.style.transform = 'translate(-50%, -50%) scale(1.2) rotate(-10deg)';
    }
    
    jump() {
        this.state = 'jumping';
        this.warningEl.classList.remove('show');
        
        const allPieces = this.game.board.getAllPieces();
        
        if (allPieces.length === 0) {
            // No pieces to eat, just animate and return
            this.animateJumpWithoutTarget();
            return;
        }
        
        // Select random piece to eat
        const target = randomElement(allPieces);
        
        this.animateJumpToPiece(target, () => {
            // Eat the piece
            this.game.board.removePiece(target.row, target.col);
            this.game.renderer.drawBoard();
            
            // Check if this caused a win condition change
            this.checkWinAfterEat();
            
            // Return to lake
            this.animateReturnToLake(() => {
                this.reset();
            });
        });
    }
    
    animateJumpWithoutTarget() {
        this.sharkEl.classList.add('jumping');
        
        setTimeout(() => {
            this.sharkEl.classList.remove('jumping');
            this.reset();
        }, 2000);
    }
    
    animateJumpToPiece(target, callback) {
        const cellSize = this.game.renderer.cellSize;
        const margin = this.game.renderer.margin;
        
        const targetX = margin + target.col * cellSize;
        const targetY = margin + target.row * cellSize;
        
        // Get shark's current position relative to game board
        const gameBoard = document.getElementById('game-board');
        const boardRect = gameBoard.getBoundingClientRect();
        const sharkRect = this.sharkEl.getBoundingClientRect();
        
        // Calculate target position relative to lake container
        const lakeContainer = document.querySelector('.lake-container');
        const lakeRect = lakeContainer.getBoundingClientRect();
        
        // Target position on board (relative to lake container)
        const relativeX = targetX - (lakeRect.left - boardRect.left) + lakeRect.width / 2;
        const relativeY = targetY - (lakeRect.top - boardRect.top) + lakeRect.height / 2;
        
        // Animate shark jumping from lake to board
        this.sharkEl.style.transition = 'all 0.8s cubic-bezier(0.5, -0.5, 0.5, 1)';
        this.sharkEl.style.left = `${relativeX}px`;
        this.sharkEl.style.top = `${relativeY - 200}px`;
        this.sharkEl.style.transform = 'translate(-50%, -50%) scale(1.5) rotate(-30deg)';
        this.sharkEl.style.fontSize = '4rem';
        
        setTimeout(() => {
            // Shark falls on piece
            this.sharkEl.style.transition = 'all 0.3s ease-in';
            this.sharkEl.style.top = `${relativeY}px`;
            this.sharkEl.style.transform = 'translate(-50%, -50%) scale(1.2) rotate(0deg)';
            
            // Splash effect
            this.createSplashEffect();
            
            setTimeout(() => {
                callback();
            }, 300);
        }, 800);
    }
    
    animateReturnToLake(callback) {
        // Shark returns to lake
        this.sharkEl.style.transition = 'all 0.8s ease';
        this.sharkEl.style.left = '50%';
        this.sharkEl.style.top = '50%';
        this.sharkEl.style.transform = 'translate(-50%, -50%) scale(1)';
        this.sharkEl.style.fontSize = '3rem';
        
        setTimeout(() => {
            callback();
        }, 800);
    }
    
    createSplashEffect() {
        // Create visual splash on board
        const canvas = document.getElementById('game-board');
        const ctx = canvas.getContext('2d');
        
        let frame = 0;
        const splashLoop = () => {
            if (frame > 20) return;
            
            // Draw splash droplets
            ctx.save();
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const dist = frame * 3;
                const x = canvas.width / 2 + Math.cos(angle) * dist;
                const y = canvas.height / 2 + Math.sin(angle) * dist;
                
                ctx.fillStyle = `rgba(30, 144, 255, ${1 - frame / 20})`;
                ctx.beginPath();
                ctx.arc(x, y, 3 + frame / 5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
            
            frame++;
            if (frame <= 20) {
                requestAnimationFrame(splashLoop);
            }
        };
        
        splashLoop();
    }
    
    checkWinAfterEat() {
        // After shark eats a piece, check if someone won
        // This is a simplified check - in full implementation, 
        // we'd need to check all possible winning lines
    }
    
    reset() {
        this.state = 'idle';
        this.timer = 0;
        this.sharkEl.style.left = '50%';
        this.sharkEl.style.top = '50%';
        this.sharkEl.style.transform = 'translate(-50%, -50%)';
        this.sharkEl.style.transition = 'transform 0.1s ease';
    }
    
    // Draw lake animation on canvas
    drawLake(ctx, width, height) {
        const time = Date.now() * 0.001;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw lake gradient
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, width / 2
        );
        gradient.addColorStop(0, '#4a9eff');
        gradient.addColorStop(0.6, '#1E90FF');
        gradient.addColorStop(1, '#0066CC');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(width / 2, height / 2, width / 2 - 5, height / 2 - 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw ripples
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 3; i++) {
            const rippleOffset = (time + i * 2) % 5;
            const rippleScale = 0.3 + rippleOffset * 0.15;
            
            ctx.beginPath();
            ctx.ellipse(
                width / 2, height / 2,
                (width / 2 - 20) * rippleScale,
                (height / 2 - 20) * rippleScale,
                0, 0, Math.PI * 2
            );
            ctx.stroke();
        }
        
        // Draw wave lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        
        for (let y = height * 0.3; y < height * 0.7; y += 15) {
            ctx.beginPath();
            for (let x = width * 0.2; x < width * 0.8; x += 5) {
                const waveY = y + Math.sin((x + time * 50) * 0.05) * 3;
                if (x === width * 0.2) {
                    ctx.moveTo(x, waveY);
                } else {
                    ctx.lineTo(x, waveY);
                }
            }
            ctx.stroke();
        }
        
        // Draw bubbles if warning
        if (this.state === 'warning') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            for (let i = 0; i < 5; i++) {
                const bx = width / 2 + Math.sin(time * 3 + i) * 30;
                const by = height / 2 + Math.cos(time * 2 + i * 0.5) * 10 - (time * 10 % 30);
                ctx.beginPath();
                ctx.arc(bx, by, 3 + Math.sin(time * 5 + i) * 1, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SharkManager };
}
