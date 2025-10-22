import Game from 'game';
import { showReplay } from 'replay-player';

window.addEventListener('load', () => {
    const canvas = document.getElementById('game-canvas');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let game;
    let replayRoot = null;

    const startScreen = document.getElementById('start-screen');
    const startButton = document.getElementById('start-button');
    const gameOverScreen = document.getElementById('game-over-screen');
    const restartButton = document.getElementById('restart-button');
    const finalScoreEl = document.getElementById('final-score');
    const scoreEl = document.getElementById('score');
    const bombsEl = document.getElementById('bombs');
    const uiContainer = document.getElementById('ui-container');
    const powerupTimerEl = document.getElementById('powerup-timer');

    function startGame() {
        startScreen.style.display = 'none';
        gameOverScreen.style.display = 'none';
        uiContainer.style.display = 'flex';
        powerupTimerEl.style.display = 'none';

        // Fix: Explicitly update canvas dimensions on restart
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        updateScore(0);
        updateBombCount(1); // Starting bombs
        if (game) {
            game.destroy();
        }
        game = new Game(canvas.width, canvas.height, canvas);
        game.onGameOver = showGameOver;
        game.onScoreUpdate = updateScore;
        game.onBombUpdate = updateBombCount;
        game.onPowerUpUpdate = updatePowerupTimer;
        animate();
    }
    
    let lastTime = 0;
    function animate(timestamp = 0) {
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;

        // ctx.clearRect(0, 0, canvas.width, canvas.height); // No longer needed
        if (game.assetsLoaded) { // Only update and draw if assets are ready
            game.update(deltaTime);
            game.draw();
        }
        
        if (!game.gameOver) {
            requestAnimationFrame(animate);
        }
    }

    function showGameOver(score, replayData) {
        uiContainer.style.display = 'none';
        gameOverScreen.style.display = 'flex';
        finalScoreEl.textContent = score;

        const watchReplayButton = document.getElementById('watch-replay-button');
        const backToScoreButton = document.getElementById('back-to-score-button');
        const gameOverContent = document.getElementById('game-over-content');
        const replayView = document.getElementById('replay-view');
        const replayContainer = document.getElementById('replay-container');

        gameOverContent.style.display = 'block';
        replayView.style.display = 'none';

        // To prevent multiple listeners, we clone and replace the button
        const newWatchReplayButton = watchReplayButton.cloneNode(true);
        watchReplayButton.parentNode.replaceChild(newWatchReplayButton, watchReplayButton);

        const newBackToScoreButton = backToScoreButton.cloneNode(true);
        backToScoreButton.parentNode.replaceChild(newBackToScoreButton, backToScoreButton);

        newWatchReplayButton.addEventListener('click', () => {
            gameOverContent.style.display = 'none';
            replayView.style.display = 'block';
            if (replayRoot) {
                replayRoot.unmount();
            }
            replayRoot = showReplay(replayContainer, replayData);
        });

        newBackToScoreButton.addEventListener('click', () => {
            gameOverContent.style.display = 'block';
            replayView.style.display = 'none';
            if (replayRoot) {
                replayRoot.unmount();
                replayRoot = null;
            }
        });
    }

    function updateScore(score) {
        scoreEl.textContent = `Score: ${score}`;
    }

    function updateBombCount(count) {
        bombsEl.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const img = document.createElement('img');
            img.src = 'bomb.png';
            img.alt = 'Bomb';
            img.style.width = '30px';
            img.style.height = '30px';
            img.style.marginRight = '4px';
            bombsEl.appendChild(img);
        }
    }

    function updatePowerupTimer(isActive, timeLeft) {
        if (isActive) {
            powerupTimerEl.style.display = 'inline-block';
            powerupTimerEl.textContent = `Rapid Fire: ${(timeLeft / 1000).toFixed(1)}s`;
        } else {
            powerupTimerEl.style.display = 'none';
        }
    }

    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (game) {
            game.resize(canvas.width, canvas.height);
        }
    });
});