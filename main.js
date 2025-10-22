import Game from 'game';

window.addEventListener('load', () => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let game;

    const startScreen = document.getElementById('start-screen');
    const startButton = document.getElementById('start-button');
    const gameOverScreen = document.getElementById('game-over-screen');
    const restartButton = document.getElementById('restart-button');
    const finalScoreEl = document.getElementById('final-score');
    const scoreEl = document.getElementById('score');
    const uiContainer = document.getElementById('ui-container');

    function startGame() {
        startScreen.style.display = 'none';
        gameOverScreen.style.display = 'none';
        uiContainer.style.display = 'block';
        game = new Game(canvas.width, canvas.height);
        game.onGameOver = showGameOver;
        game.onScoreUpdate = updateScore;
        animate();
    }
    
    let lastTime = 0;
    function animate(timestamp = 0) {
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        game.update(deltaTime);
        game.draw(ctx);
        
        if (!game.gameOver) {
            requestAnimationFrame(animate);
        }
    }

    function showGameOver(score) {
        uiContainer.style.display = 'none';
        gameOverScreen.style.display = 'flex';
        finalScoreEl.textContent = score;
    }

    function updateScore(score) {
        scoreEl.textContent = `Score: ${score}`;
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