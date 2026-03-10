// Main entry point for Skill Gomoku

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

// Add CSS animation for board shake
const style = document.createElement('style');
style.textContent = `
    @keyframes boardShake {
        0%, 100% { transform: translate(0, 0); }
        10% { transform: translate(-5px, -5px); }
        20% { transform: translate(5px, 5px); }
        30% { transform: translate(-5px, 5px); }
        40% { transform: translate(5px, -5px); }
        50% { transform: translate(-3px, 3px); }
        60% { transform: translate(3px, -3px); }
        70% { transform: translate(-2px, 2px); }
        80% { transform: translate(2px, -2px); }
        90% { transform: translate(-1px, 1px); }
    }
`;
document.head.appendChild(style);
