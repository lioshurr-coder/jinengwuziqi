// Utility functions for Skill Gomoku game

// Generate a random integer between min and max (inclusive)
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Get random element from array
function randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Deep clone an object
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Check if position is within board bounds
function isValidPosition(row, col, boardSize = 15) {
    return row >= 0 && row < boardSize && col >= 0 && col < boardSize;
}

// Format time display
function formatTime(seconds) {
    return seconds.toString();
}

// Easing functions for animations
const Easing = {
    linear: t => t,
    easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeOut: t => t * (2 - t),
    easeIn: t => t * t,
    elastic: t => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
    }
};

// Animation helper
function animate({ duration, easing, draw, onComplete }) {
    const start = performance.now();
    
    function frame(time) {
        const elapsed = time - start;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easing ? easing(progress) : progress;
        
        draw(easedProgress);
        
        if (progress < 1) {
            requestAnimationFrame(frame);
        } else if (onComplete) {
            onComplete();
        }
    }
    
    requestAnimationFrame(frame);
}

// Particle system for effects
class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    createExplosion(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.02 + Math.random() * 0.02,
                color,
                size: 3 + Math.random() * 4
            });
        }
    }
    
    update() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // gravity
            p.life -= p.decay;
            return p.life > 0;
        });
    }
    
    draw(ctx) {
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }
    
    isEmpty() {
        return this.particles.length === 0;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { randomInt, randomElement, deepClone, isValidPosition, formatTime, Easing, animate, ParticleSystem };
}
