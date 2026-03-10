// Skill implementations for Skill Gomoku

class SkillManager {
    constructor(game) {
        this.game = game;
        this.pendingSkill = null;    // Current skill being activated
        this.pendingTargetMode = null; // 'select_piece' for skills that need target
        this.windParticles = [];
        this.bookThrown = false;
        this.dragState = null;       // For throw-into-lake drag
        this.waterFlowStart = null;  // For water-flow drag start position
    }
    
    // Activate a skill
    activateSkill(playerIndex, skillIndex) {
        const player = this.game.players[playerIndex];
        const skillInfo = player.getSkill(skillIndex);
        
        if (!skillInfo) return;
        
        const opponentColor = playerIndex === 0 ? 'white' : 'black';
        const opponentHasPieces = this.game.board.hasColorPieces(opponentColor);
        
        // Most offensive skills require opponent to have pieces
        const requiresOpponentPieces = [
            'fei_sha_zou_shi', 'reng_jin_shi_cha_hai', 
            'zhi_ku_bao_gao', 'da_yu_mao_qiu'
        ];
        
        if (requiresOpponentPieces.includes(skillInfo.id) && !opponentHasPieces) {
            this.game.ui.showMessage('对方棋盘上没有棋子，无法使用此技能！', 2000);
            return;
        }
        
        this.pendingSkill = { playerIndex, skillIndex, skillInfo };
        
        switch (skillInfo.id) {
            case 'fei_sha_zou_shi':
                this.executeFeiShaZouShi(playerIndex, skillIndex);
                break;
            case 'li_ba_shan_xi':
                this.executeLiBaShanXi(playerIndex, skillIndex);
                break;
            case 'reng_jin_shi_cha_hai':
                this.startRengJinShiChaHai(playerIndex, skillIndex);
                break;
            case 'liang_ji_fan_zhuan':
                this.executeLiangJiFanZhuan(playerIndex, skillIndex);
                break;
            case 'shui_dao_qu_cheng':
                this.startShuiDaoQuCheng(playerIndex, skillIndex);
                break;
            case 'zhi_ku_bao_gao':
                this.executeZhiKuBaoGao(playerIndex, skillIndex);
                break;
            case 'da_yu_mao_qiu':
                this.startDaYuMaoQiu(playerIndex, skillIndex);
                break;
        }
    }
    
    // 飞沙走石 - Remove random opponent piece
    executeFeiShaZouShi(playerIndex, skillIndex) {
        const opponentColor = playerIndex === 0 ? 'white' : 'black';
        const opponentPieces = this.game.board.getPieces(opponentColor);
        
        if (opponentPieces.length === 0) {
            this.game.ui.showMessage('对方没有棋子！', 2000);
            this.pendingSkill = null;
            return;
        }
        
        // Remove skill card
        const skillInfo = this.game.players[playerIndex].useSkill(skillIndex);
        this.game.ui.showSkillDescription(skillInfo);
        
        // Pick random piece
        const target = randomElement(opponentPieces);
        
        // Animate wind effect
        this.animateWindEffect(target.row, target.col, () => {
            this.game.board.removePiece(target.row, target.col);
            this.game.renderer.drawBoard();
            this.game.endTurn();
        });
        
        this.pendingSkill = null;
    }
    
    // 力拔山兮 - Reset board
    executeLiBaShanXi(playerIndex, skillIndex) {
        const skillInfo = this.game.players[playerIndex].useSkill(skillIndex);
        this.game.ui.showSkillDescription(skillInfo);
        
        // Animate shark smashing board
        this.animateSharkSmash(() => {
            this.game.resetBoard();
        });
        
        this.pendingSkill = null;
    }
    
    // 扔进什刹海 - Start drag mode to throw piece into lake
    startRengJinShiChaHai(playerIndex, skillIndex) {
        const opponentColor = playerIndex === 0 ? 'white' : 'black';
        const pieces = this.game.board.getPieces(opponentColor);
        
        if (pieces.length === 0) {
            this.pendingSkill = null;
            return;
        }
        
        this.game.ui.showMessage('点击对手的棋子并拖拽到什刹海中！', 3000);
        
        // Enter drag mode
        this.pendingTargetMode = 'throw_to_lake';
        this.game.renderer.highlightPieces(pieces);
    }
    
    // Execute throw to lake
    executeRengJinShiChaHai(row, col) {
        if (!this.pendingSkill) return;
        
        const { playerIndex, skillIndex } = this.pendingSkill;
        const skillInfo = this.game.players[playerIndex].useSkill(skillIndex);
        this.game.ui.showSkillDescription(skillInfo);
        
        // Animate throw to lake
        this.animateThrowToLake(row, col, () => {
            this.game.board.removePiece(row, col);
            this.game.renderer.drawBoard();
            this.game.renderer.clearHighlights();
            this.pendingTargetMode = null;
            this.pendingSkill = null;
            this.game.endTurn();
        });
    }
    
    // 两极反转 - Swap all piece colors
    executeLiangJiFanZhuan(playerIndex, skillIndex) {
        const skillInfo = this.game.players[playerIndex].useSkill(skillIndex);
        this.game.ui.showSkillDescription(skillInfo);
        
        // Animate color swap
        this.animateColorSwap(() => {
            this.game.board.swapColors();
            // Also swap player colors logically
            const tmpColor = this.game.players[0].color;
            this.game.players[0].color = this.game.players[1].color;
            this.game.players[1].color = tmpColor;
            
            this.game.renderer.drawBoard();
            this.game.ui.updatePlayerColors();
            this.game.endTurn();
        });
        
        this.pendingSkill = null;
    }
    
    // 水到渠成 - Start water flow drag from lake
    startShuiDaoQuCheng(playerIndex, skillIndex) {
        this.game.ui.showMessage('点击什刹海并拖拽一股水流到棋盘上！', 3000);
        this.pendingTargetMode = 'water_flow';
        // Visual: highlight lake area and add CSS class
        this.game.renderer.highlightLake();
        const lakeCanvas = document.getElementById('lake-canvas');
        if (lakeCanvas) {
            lakeCanvas.classList.add('water-flow-mode');
        }
    }
    
    // Execute water flow
    executeShuiDaoQuCheng(startRow, startCol, endRow, endCol) {
        if (!this.pendingSkill) return;
        
        const { playerIndex, skillIndex } = this.pendingSkill;
        const skillInfo = this.game.players[playerIndex].useSkill(skillIndex);
        this.game.ui.showSkillDescription(skillInfo);
        
        // Generate wavy water cells
        const waterCells = this.generateWaterFlow(startRow, startCol, endRow, endCol);
        
        // Animate water flowing in
        this.animateWaterFlow(waterCells, () => {
            // Remove pieces in water zone and mark as water
            waterCells.forEach(cell => {
                this.game.board.grid[cell.row][cell.col] = CELL_STATE.EMPTY;
            });
            this.game.board.addWaterZone(waterCells);
            this.game.renderer.drawBoard();
            this.game.renderer.clearHighlights();
            
            // Remove water flow mode class
            const lakeCanvas = document.getElementById('lake-canvas');
            if (lakeCanvas) {
                lakeCanvas.classList.remove('water-flow-mode');
            }
            
            this.pendingTargetMode = null;
            this.pendingSkill = null;
            this.waterFlowStart = null;
            this.game.endTurn();
        });
    }
    
    // 智库报告 - Explode all opponent pieces
    executeZhiKuBaoGao(playerIndex, skillIndex) {
        const skillInfo = this.game.players[playerIndex].useSkill(skillIndex);
        this.game.ui.showSkillDescription(skillInfo);
        
        const opponentColor = playerIndex === 0 ? 'white' : 'black';
        const opponentPieces = this.game.board.getPieces(opponentColor);
        
        // Animate book throw then explosion
        this.animateBookThrow(opponentPieces, () => {
            // Create craters where pieces were
            opponentPieces.forEach(piece => {
                this.game.board.addCrater(piece.row, piece.col);
            });
            
            this.game.renderer.drawBoard();
            this.game.endTurn();
        });
        
        this.pendingSkill = null;
    }
    
    // 打羽毛球 - Start selecting opponent piece to turn into badminton
    startDaYuMaoQiu(playerIndex, skillIndex) {
        const opponentColor = playerIndex === 0 ? 'white' : 'black';
        const pieces = this.game.board.getPieces(opponentColor);
        
        if (pieces.length === 0) {
            this.pendingSkill = null;
            return;
        }
        
        this.game.ui.showMessage('点击一颗对手的棋子，将其变成羽毛球！', 3000);
        this.pendingTargetMode = 'select_badminton';
        this.game.renderer.highlightPieces(pieces);
    }
    
    // Execute badminton transformation
    executeDaYuMaoQiu(row, col) {
        if (!this.pendingSkill) return;
        
        const { playerIndex, skillIndex } = this.pendingSkill;
        const skillInfo = this.game.players[playerIndex].useSkill(skillIndex);
        this.game.ui.showSkillDescription(skillInfo);
        
        this.animateBadmintonTransform(row, col, () => {
            this.game.board.addBadminton(row, col);
            this.game.renderer.drawBoard();
            this.game.renderer.clearHighlights();
            this.pendingTargetMode = null;
            this.pendingSkill = null;
            this.game.endTurn();
        });
    }
    
    // Cancel pending skill action
    cancelPendingSkill() {
        if (this.pendingSkill) {
            this.pendingTargetMode = null;
            this.pendingSkill = null;
            this.waterFlowStart = null;
            this.game.renderer.clearHighlights();
            
            // Remove water flow mode class
            const lakeCanvas = document.getElementById('lake-canvas');
            if (lakeCanvas) {
                lakeCanvas.classList.remove('water-flow-mode');
            }
            
            this.game.ui.showMessage('技能取消', 1000);
        }
    }
    
    // Generate water flow cells between two points on board
    generateWaterFlow(startRow, startCol, endRow, endCol) {
        const cells = [];
        const rowDiff = endRow - startRow;
        const colDiff = endCol - startCol;
        const steps = Math.max(Math.abs(rowDiff), Math.abs(colDiff));
        
        if (steps === 0) return [];
        
        // Generate wavy horizontal or vertical line
        const isHorizontal = Math.abs(colDiff) >= Math.abs(rowDiff);
        
        if (isHorizontal) {
            // Horizontal flow with wave
            const minCol = Math.min(startCol, endCol);
            const maxCol = Math.max(startCol, endCol);
            const baseRow = Math.round((startRow + endRow) / 2);
            for (let col = minCol; col <= maxCol; col++) {
                const waveOffset = Math.round(Math.sin((col - minCol) * 0.8) * 1);
                const row = baseRow + waveOffset;
                if (isValidPosition(row, col)) {
                    cells.push({ row, col });
                    // Also include adjacent row for width
                    if (isValidPosition(row + 1, col)) {
                        cells.push({ row: row + 1, col });
                    }
                }
            }
        } else {
            // Vertical flow with wave
            const minRow = Math.min(startRow, endRow);
            const maxRow = Math.max(startRow, endRow);
            const baseCol = Math.round((startCol + endCol) / 2);
            for (let row = minRow; row <= maxRow; row++) {
                const waveOffset = Math.round(Math.sin((row - minRow) * 0.8) * 1);
                const col = baseCol + waveOffset;
                if (isValidPosition(row, col)) {
                    cells.push({ row, col });
                    // Also include adjacent col for width
                    if (isValidPosition(row, col + 1)) {
                        cells.push({ row, col: col + 1 });
                    }
                }
            }
        }
        
        // Deduplicate
        const unique = cells.filter((cell, index, self) =>
            index === self.findIndex(c => c.row === cell.row && c.col === cell.col)
        );
        
        return unique;
    }
    
    // ==================== ANIMATIONS ====================
    
    animateWindEffect(targetRow, targetCol, callback) {
        const ctx = this.game.renderer.ctx;
        const canvas = this.game.renderer.canvas;
        const cellSize = this.game.renderer.cellSize;
        const margin = this.game.renderer.margin;
        
        const targetX = margin + targetCol * cellSize;
        const targetY = margin + targetRow * cellSize;
        
        const windLines = Array(20).fill(null).map(() => ({
            x: -100 + Math.random() * canvas.width * 0.5,
            y: Math.random() * canvas.height,
            length: 30 + Math.random() * 50,
            speed: 15 + Math.random() * 10,
            opacity: 0.5 + Math.random() * 0.5
        }));
        
        let frame = 0;
        const totalFrames = 60;
        
        const loop = () => {
            this.game.renderer.drawBoard();
            
            ctx.save();
            windLines.forEach(line => {
                line.x += line.speed;
                ctx.strokeStyle = `rgba(200, 200, 255, ${line.opacity})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(line.x, line.y);
                ctx.lineTo(line.x + line.length, line.y);
                ctx.stroke();
                
                if (line.x > canvas.width) {
                    line.x = -100;
                    line.y = Math.random() * canvas.height;
                }
            });
            
            // Draw wind vortex at target
            if (frame > 20) {
                const progress = (frame - 20) / 40;
                ctx.strokeStyle = `rgba(200, 200, 255, ${1 - progress})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(targetX, targetY, (1 - progress) * 20 + 5, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
            
            frame++;
            if (frame < totalFrames) {
                requestAnimationFrame(loop);
            } else {
                callback();
            }
        };
        
        requestAnimationFrame(loop);
    }
    
    animateSharkSmash(callback) {
        const canvas = this.game.renderer.canvas;
        const ctx = this.game.renderer.ctx;
        const lakeCanvas = document.getElementById('lake-canvas');
        const shark = document.getElementById('shark');
        
        // Animate shark rising from lake
        shark.style.transition = 'all 1.5s cubic-bezier(0.5, -0.5, 0.5, 1.5)';
        shark.style.transform = 'translate(-50%, -350%) scale(2) rotate(-20deg)';
        shark.style.fontSize = '5rem';
        
        setTimeout(() => {
            // Shark falls on board
            shark.style.transition = 'all 0.5s ease-in';
            shark.style.transform = 'translate(-50%, -50%) scale(1.5)';
            
            // Board shake animation
            const gameBoard = document.getElementById('game-board');
            gameBoard.style.animation = 'boardShake 0.5s ease';
            
            setTimeout(() => {
                // Flash effect - board breaking
                let breakFrame = 0;
                const breakLoop = () => {
                    ctx.save();
                    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 - breakFrame * 0.1})`;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.restore();
                    
                    // Draw crack lines
                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 3;
                    for (let i = 0; i < 5; i++) {
                        ctx.beginPath();
                        const sx = Math.random() * canvas.width;
                        const sy = Math.random() * canvas.height;
                        ctx.moveTo(sx, sy);
                        ctx.lineTo(sx + Math.random() * 100 - 50, sy + Math.random() * 100 - 50);
                        ctx.stroke();
                    }
                    
                    breakFrame++;
                    if (breakFrame < 5) {
                        requestAnimationFrame(breakLoop);
                    } else {
                        // Reset shark
                        shark.style.transition = 'all 1s ease';
                        shark.style.transform = 'translate(-50%, -50%) scale(1)';
                        shark.style.fontSize = '3rem';
                        callback();
                    }
                };
                requestAnimationFrame(breakLoop);
            }, 600);
        }, 1200);
    }
    
    animateThrowToLake(row, col, callback) {
        const ctx = this.game.renderer.ctx;
        const cellSize = this.game.renderer.cellSize;
        const margin = this.game.renderer.margin;
        
        const startX = margin + col * cellSize;
        const startY = margin + row * cellSize;
        
        // Target: lake center (below board)
        const lakeSection = document.querySelector('.lake-section');
        const gameBoard = document.getElementById('game-board');
        const boardRect = gameBoard.getBoundingClientRect();
        const lakeSectionRect = lakeSection.getBoundingClientRect();
        
        // Calculate lake center relative to canvas
        const lakeX = (lakeSectionRect.left - boardRect.left) + lakeSectionRect.width / 2;
        const lakeY = (lakeSectionRect.top - boardRect.top) + lakeSectionRect.height / 2;
        
        const color = this.game.board.getCell(row, col) === CELL_STATE.BLACK ? '#1a1a1a' : '#f5f5f5';
        
        let progress = 0;
        const arcHeight = -200; // Height of throw arc
        
        const loop = () => {
            this.game.renderer.drawBoard();
            progress += 0.03;
            
            if (progress >= 1) {
                // Show splash
                ctx.font = '2rem Arial';
                ctx.fillText('💦', lakeX - 16, startY + 50);
                setTimeout(callback, 300);
                return;
            }
            
            // Arc trajectory
            const x = startX + (lakeX - startX) * progress;
            const y = startY + (lakeY - startY) * progress + arcHeight * Math.sin(progress * Math.PI);
            
            // Draw trajectory trail
            ctx.save();
            ctx.strokeStyle = 'rgba(74, 158, 255, 0.5)';
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            // Draw arc
            for (let t = 0; t <= progress; t += 0.05) {
                const tx = startX + (lakeX - startX) * t;
                const ty = startY + (lakeY - startY) * t + arcHeight * Math.sin(t * Math.PI);
                ctx.lineTo(tx, ty);
            }
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Draw piece
            ctx.beginPath();
            ctx.arc(x, y, cellSize * 0.38, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = color === '#1a1a1a' ? '#666' : '#333';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
            
            requestAnimationFrame(loop);
        };
        
        requestAnimationFrame(loop);
    }
    
    animateColorSwap(callback) {
        const ctx = this.game.renderer.ctx;
        const canvas = this.game.renderer.canvas;
        
        let frame = 0;
        const totalFrames = 30;
        
        const loop = () => {
            this.game.renderer.drawBoard();
            const progress = frame / totalFrames;
            
            // Swirl overlay
            ctx.save();
            const gradient = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, 0,
                canvas.width / 2, canvas.height / 2, canvas.width * 0.7
            );
            
            if (progress < 0.5) {
                gradient.addColorStop(0, `rgba(255, 255, 255, ${progress * 2})`);
                gradient.addColorStop(1, `rgba(0, 0, 0, ${progress * 2})`);
            } else {
                gradient.addColorStop(0, `rgba(255, 255, 255, ${(1 - progress) * 2})`);
                gradient.addColorStop(1, `rgba(0, 0, 0, ${(1 - progress) * 2})`);
            }
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
            
            frame++;
            if (frame < totalFrames) {
                requestAnimationFrame(loop);
            } else {
                callback();
            }
        };
        
        requestAnimationFrame(loop);
    }
    
    animateWaterFlow(cells, callback) {
        const ctx = this.game.renderer.ctx;
        const cellSize = this.game.renderer.cellSize;
        const margin = this.game.renderer.margin;
        
        let revealedCount = 0;
        const revealStep = 2; // Reveal 2 cells per frame
        
        const loop = () => {
            this.game.renderer.drawBoard();
            
            // Draw revealed water cells
            for (let i = 0; i < revealedCount && i < cells.length; i++) {
                const cell = cells[i];
                const x = margin + cell.col * cellSize;
                const y = margin + cell.row * cellSize;
                const t = Date.now() * 0.003 + i * 0.3;
                
                ctx.save();
                ctx.fillStyle = `rgba(30, 144, 255, 0.7)`;
                ctx.fillRect(x - cellSize / 2, y - cellSize / 2, cellSize, cellSize);
                
                // Wave effect
                ctx.fillStyle = `rgba(100, 200, 255, ${0.3 + 0.2 * Math.sin(t)})`;
                ctx.beginPath();
                ctx.arc(x, y, cellSize * 0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            
            revealedCount += revealStep;
            
            if (revealedCount < cells.length) {
                requestAnimationFrame(loop);
            } else {
                callback();
            }
        };
        
        requestAnimationFrame(loop);
    }
    
    animateBookThrow(opponentPieces, callback) {
        const ctx = this.game.renderer.ctx;
        const canvas = this.game.renderer.canvas;
        const cellSize = this.game.renderer.cellSize;
        const margin = this.game.renderer.margin;
        
        // Phase 1: Throw book from top
        let phase = 1;
        let bookY = -50;
        let bookX = canvas.width / 2;
        let explodedPieces = [];
        
        const loop = () => {
            this.game.renderer.drawBoard();
            
            if (phase === 1) {
                // Book falling
                bookY += 15;
                ctx.font = '3rem Arial';
                ctx.fillText('📖', bookX - 24, bookY);
                
                if (bookY > canvas.height / 2) {
                    phase = 2;
                    // Start explosions
                    explodedPieces = [...opponentPieces];
                }
                requestAnimationFrame(loop);
            } else if (phase === 2) {
                // Explosions on all opponent pieces
                ctx.font = '3rem Arial';
                ctx.fillText('📖', bookX - 24, canvas.height / 2);
                
                let allDone = true;
                opponentPieces.forEach((piece, i) => {
                    const x = margin + piece.col * cellSize;
                    const y = margin + piece.row * cellSize;
                    const delay = i * 3;
                    
                    if (!piece.explodeFrame) piece.explodeFrame = 0;
                    
                    if (piece.explodeFrame < 20) {
                        allDone = false;
                        piece.explodeFrame++;
                        
                        const progress = piece.explodeFrame / 20;
                        ctx.font = `${1.5 + progress}rem Arial`;
                        ctx.globalAlpha = 1 - progress;
                        ctx.fillText('💥', x - 16, y + 8);
                        ctx.globalAlpha = 1;
                        
                        // Ring effect
                        ctx.strokeStyle = `rgba(255, 150, 0, ${1 - progress})`;
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.arc(x, y, progress * 30, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                });
                
                if (allDone) {
                    callback();
                } else {
                    requestAnimationFrame(loop);
                }
            }
        };
        
        requestAnimationFrame(loop);
    }
    
    animateBadmintonTransform(row, col, callback) {
        const ctx = this.game.renderer.ctx;
        const cellSize = this.game.renderer.cellSize;
        const margin = this.game.renderer.margin;
        const x = margin + col * cellSize;
        const y = margin + row * cellSize;
        
        let frame = 0;
        const totalFrames = 30;
        
        const loop = () => {
            this.game.renderer.drawBoard();
            
            const progress = frame / totalFrames;
            const scale = 1 + Math.sin(progress * Math.PI) * 0.5;
            
            ctx.save();
            ctx.font = `${cellSize * scale * 0.06 + 1}rem Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = progress;
            ctx.fillText('🏸', x, y);
            ctx.restore();
            
            frame++;
            if (frame < totalFrames) {
                requestAnimationFrame(loop);
            } else {
                callback();
            }
        };
        
        requestAnimationFrame(loop);
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SkillManager };
}
