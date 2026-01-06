class ArcheryGame {
    constructor() {
        this.score = 0;
        this.arrows = 10;
        this.gameActive = true;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.bowCenter = { x: 0, y: 0 };
        this.maxStretch = 150;
        
        this.elements = {
            bow: document.getElementById('bow'),
            target: document.getElementById('target'),
            scoreDisplay: document.getElementById('score'),
            arrowsDisplay: document.getElementById('arrows'),
            resetBtn: document.getElementById('resetBtn'),
            gameOver: document.getElementById('gameOver'),
            finalScore: document.getElementById('finalScore'),
            stretchLine: document.getElementById('stretchLine')
        };
        
        this.initializeGame();
    }
    
    initializeGame() {
        this.elements.resetBtn.addEventListener('click', () => this.resetGame());
        
        // Mouse events for bow
        this.elements.bow.addEventListener('mousedown', (e) => this.startDrag(e));
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', (e) => this.endDrag(e));
        
        // Touch events for mobile
        this.elements.bow.addEventListener('touchstart', (e) => this.startDrag(e.touches[0]));
        document.addEventListener('touchmove', (e) => this.drag(e.touches[0]));
        document.addEventListener('touchend', (e) => this.endDrag(e));
        
        this.updateDisplay();
        this.setBowCenter();
    }
    
    setBowCenter() {
        const bowRect = this.elements.bow.getBoundingClientRect();
        this.bowCenter.x = bowRect.left + bowRect.width / 2;
        this.bowCenter.y = bowRect.top + bowRect.height / 2;
    }
    
    startDrag(e) {
        if (!this.gameActive || this.arrows <= 0) return;
        
        this.isDragging = true;
        this.dragStart.x = e.clientX;
        this.dragStart.y = e.clientY;
        this.setBowCenter();
        
        this.elements.bow.classList.add('dragging');
        this.elements.stretchLine.classList.add('visible');
        
        e.preventDefault();
    }
    
    drag(e) {
        if (!this.isDragging || !this.gameActive) return;
        
        const deltaX = this.dragStart.x - e.clientX;
        const deltaY = this.dragStart.y - e.clientY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const clampedDistance = Math.min(distance, this.maxStretch);
        
        // Update stretch line
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        this.elements.stretchLine.style.width = clampedDistance + 'px';
        this.elements.stretchLine.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
        
        // Move bow slightly based on stretch
        const stretchFactor = clampedDistance / this.maxStretch;
        const moveX = deltaX * 0.3 * stretchFactor;
        const moveY = deltaY * 0.3 * stretchFactor;
        
        this.elements.bow.style.transform = `translate(calc(-50% + ${-moveX}px), calc(-50% + ${-moveY}px)) scale(${1.2 - stretchFactor * 0.2}) rotate(${angle+45}deg)`;
        
        
        // Update power indicator
        this.showPowerIndicator(Math.round((clampedDistance / this.maxStretch) * 100));
    }
    
    endDrag(e) {
        if (!this.isDragging || !this.gameActive) return;
        
        const deltaX = this.dragStart.x - (e.clientX || this.dragStart.x);
        const deltaY = this.dragStart.y - (e.clientY || this.dragStart.y);
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const power = Math.min(distance / this.maxStretch, 1);
        
        if (power > 0.1) { // Minimum power threshold
            this.shootArrow(deltaX, deltaY, power);
        }
        
        this.resetBowPosition();
        this.isDragging = false;
    }
    
    resetBowPosition() {
        this.elements.bow.classList.remove('dragging');
        this.elements.bow.style.transform = 'translate(-50%, -50%)';
        this.elements.stretchLine.classList.remove('visible');
        this.elements.stretchLine.style.width = '0px';
        this.hidePowerIndicator();
    }
    
    showPowerIndicator(power) {
        let indicator = document.querySelector('.power-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'power-indicator';
            document.querySelector('.bow-area').appendChild(indicator);
        }
        
        indicator.textContent = `Power: ${power}%`;
        indicator.classList.add('visible');
        
        // Color based on power
        if (power < 30) indicator.style.color = '#ff6b6b';
        else if (power < 70) indicator.style.color = '#ffd93d';
        else indicator.style.color = '#6bcf7f';
    }
    
    hidePowerIndicator() {
        const indicator = document.querySelector('.power-indicator');
        if (indicator) {
            indicator.classList.remove('visible');
        }
    }
    
    shootArrow(deltaX, deltaY, power) {
        this.arrows--;
        this.updateDisplay();
        
        // Create and animate arrow
        const arrow = document.createElement('div');
        arrow.className = 'flying-arrow';
        arrow.innerHTML = '➳';
        
        const gameArea = document.querySelector('.game-area');
        gameArea.appendChild(arrow);
        
        // Calculate trajectory
        const angle = Math.atan2(deltaY, deltaX);
        const startX = this.bowCenter.x - gameArea.getBoundingClientRect().left;
        const startY = this.bowCenter.y - gameArea.getBoundingClientRect().top;
        
        // Target area center
        const targetRect = this.elements.target.getBoundingClientRect();
        const gameAreaRect = gameArea.getBoundingClientRect();
        const targetCenterX = targetRect.left + targetRect.width / 2 - gameAreaRect.left;
        const targetCenterY = targetRect.top + targetRect.height / 2 - gameAreaRect.top;
        
        // Calculate landing position based on power and direction
        const baseDistance = 400 * power;
        const landX = startX + Math.cos(angle) * baseDistance;
        const landY = startY + Math.sin(angle) * baseDistance;
        
        // Set initial position
        arrow.style.left = startX + 'px';
        arrow.style.top = startY + 'px';
        arrow.style.transform = `rotate(${angle * 180 / Math.PI}deg)`;
        
        // Animate arrow flight
        const duration = 800 + (1 - power) * 400; // Faster with more power
        arrow.style.transition = `all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
        
        setTimeout(() => {
            arrow.style.left = landX + 'px';
            arrow.style.top = landY + 'px';
        }, 50);
        
        // Check for hit after animation
        setTimeout(() => {
            this.checkHit(landX, landY, targetCenterX, targetCenterY);
            arrow.remove();
            this.checkGameEnd();
        }, duration + 100);
    }
    
    checkHit(arrowX, arrowY, targetCenterX, targetCenterY) {
        const distance = Math.sqrt(
            Math.pow(arrowX - targetCenterX, 2) + 
            Math.pow(arrowY - targetCenterY, 2)
        );
        
        const rings = [
            { radius: 28, points: 10, element: document.querySelector('.ring-1') },
            { radius: 56, points: 8, element: document.querySelector('.ring-2') },
            { radius: 84, points: 6, element: document.querySelector('.ring-3') },
            { radius: 112, points: 4, element: document.querySelector('.ring-4') },
            { radius: 140, points: 2, element: document.querySelector('.ring-5') }
        ];
        
        for (let ring of rings) {
            if (distance <= ring.radius) {
                this.hitTarget(ring.element, ring.points);
                return;
            }
        }
        
        this.missTarget();
    }
    
    hitTarget(ringElement, points) {
        this.score += points;
        
        // Add hit effect
        ringElement.classList.add('hit-effect');
        setTimeout(() => ringElement.classList.remove('hit-effect'), 500);
        
        // Show points earned
        this.showPointsEarned(points, ringElement);
        this.updateDisplay();
    }
    
    missTarget() {
        this.showMissMessage();
    }
    
    showPointsEarned(points, ring) {
        const pointsDisplay = document.createElement('div');
        pointsDisplay.textContent = `+${points}`;
        pointsDisplay.style.cssText = `
            position: absolute;
            top: -30px;
            left: 50%;
            transform: translateX(-50%);
            color: #ffd700;
            font-size: 2em;
            font-weight: bold;
            pointer-events: none;
            z-index: 100;
            animation: fadeUpOut 1.5s ease-out forwards;
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
        `;
        
        // Add fadeUpOut animation if not exists
        if (!document.querySelector('#fadeUpOutStyle')) {
            const style = document.createElement('style');
            style.id = 'fadeUpOutStyle';
            style.textContent = `
                @keyframes fadeUpOut {
                    0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
                    50% { transform: translateX(-50%) translateY(-15px) scale(1.2); }
                    100% { opacity: 0; transform: translateX(-50%) translateY(-40px) scale(0.8); }
                }
            `;
            document.head.appendChild(style);
        }
        
        ring.appendChild(pointsDisplay);
        setTimeout(() => pointsDisplay.remove(), 1500);
    }
    
    showMissMessage() {
        const missDisplay = document.createElement('div');
        missDisplay.textContent = 'MISS!';
        missDisplay.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #ff4444;
            font-size: 3em;
            font-weight: bold;
            pointer-events: none;
            z-index: 1000;
            animation: missAnimation 1.5s ease-out forwards;
            text-shadow: 0 0 20px rgba(255, 68, 68, 0.8);
        `;
        
        // Add miss animation if not exists
        if (!document.querySelector('#missAnimationStyle')) {
            const style = document.createElement('style');
            style.id = 'missAnimationStyle';
            style.textContent = `
                @keyframes missAnimation {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(missDisplay);
        setTimeout(() => missDisplay.remove(), 1500);
    }
    
    updateDisplay() {
        this.elements.scoreDisplay.textContent = this.score;
        this.elements.arrowsDisplay.textContent = this.arrows;
    }
    
    checkGameEnd() {
        if (this.arrows <= 0) {
            this.endGame();
        }
    }
    
    endGame() {
        this.gameActive = false;
        this.elements.resetBtn.style.display = 'inline-block';
        this.elements.gameOver.style.display = 'block';
        this.elements.finalScore.textContent = this.score;
        this.resetBowPosition();
    }
    
    resetGame() {
        this.score = 0;
        this.arrows = 10;
        this.gameActive = true;
        this.isDragging = false;
        
        this.elements.resetBtn.style.display = 'none';
        this.elements.gameOver.style.display = 'none';
        
        this.resetBowPosition();
        this.updateDisplay();
    }
}

// Start the game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ArcheryGame();
});
