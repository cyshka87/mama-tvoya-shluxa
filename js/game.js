"use strict";

const cvs = document.getElementById("canvas");
const ctx = cvs.getContext("2d");

// ----- настройки игры -----
const GRAVITY = 0.35;
const JUMP = -6.5;
const PIPE_GAP = 110;
const PIPE_SPEED = 2;
const PIPE_SPAWN_INTERVAL = 1500; // мс

// ----- птичка -----
const birdImg = new Image();
birdImg.src = "assets/bird.png";

const bird = {
    x: 40,
    y: cvs.height / 2,
    w: 34,
    h: 24,
    vy: 0,
    ready: false
};

// после загрузки изображения подгоним размер под его реальное соотношение
birdImg.onload = () => {
    const aspect = birdImg.width / birdImg.height || (34 / 24);
    bird.h = 60;
    bird.w = bird.h * aspect;
    bird.ready = true;
};

// ----- трубы -----
const pipes = []; // элементы: {x, topH, passed}

// ----- счёт -----
let score = 0;
let best = 0;
let lastSpawn = 0;
let lastTime = 0;
let gameOver = false;

// ----- управление -----
function flap() {
    if (!bird.ready) return;
    if (gameOver) {
        resetGame();
        return;
    }
    bird.vy = JUMP;
}

document.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") {
        flap();
        e.preventDefault();
    }
});

document.addEventListener("mousedown", flap);
document.addEventListener("touchstart", (e) => {
    flap();
    e.preventDefault();
}, { passive: false });

// ----- логика -----
function resetGame() {
    pipes.length = 0;
    score = 0;
    gameOver = false;
    bird.y = cvs.height / 2;
    bird.vy = 0;
    lastSpawn = 0;
}

function spawnPipe() {
    const minTop = 40;
    const maxTop = cvs.height - PIPE_GAP - 80;
    const topH = Math.random() * (maxTop - minTop) + minTop;

    pipes.push({
        x: cvs.width,
        topH,
        passed: false
    });
}

function update(delta) {
    if (!bird.ready) return;

    // гравитация
    bird.vy += GRAVITY * delta * 0.06;
    bird.y += bird.vy * delta * 0.06;

    // спавн труб
    lastSpawn += delta;
    if (lastSpawn >= PIPE_SPAWN_INTERVAL) {
        spawnPipe();
        lastSpawn = 0;
    }

    // обновление труб и коллизии
    for (let i = pipes.length - 1; i >= 0; i--) {
        const p = pipes[i];
        p.x -= PIPE_SPEED * delta * 0.06;

        // столкновение
        const inX = bird.x + bird.w > p.x && bird.x < p.x + 52;
        const hitTop = bird.y < p.topH;
        const hitBottom = bird.y + bird.h > p.topH + PIPE_GAP;

        if (inX && (hitTop || hitBottom)) {
            gameOver = true;
        }

        // вылетели за экран — удаляем
        if (p.x + 52 < 0) {
            pipes.splice(i, 1);
            continue;
        }

        // счёт
        if (!p.passed && p.x + 52 < bird.x) {
            p.passed = true;
            score++;
            if (score > best) best = score;
        }
    }

    // столкновение с землёй/потолком
    if (bird.y + bird.h >= cvs.height - 40 || bird.y <= 0) {
        gameOver = true;
    }
}

function drawBackground() {
    // небо
    const gradient = ctx.createLinearGradient(0, 0, 0, cvs.height);
    gradient.addColorStop(0, "#70c5ce");
    gradient.addColorStop(1, "#f0f9ff");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    // земля
    ctx.fillStyle = "#ded895";
    ctx.fillRect(0, cvs.height - 40, cvs.width, 40);
    ctx.fillStyle = "#c8c06a";
    ctx.fillRect(0, cvs.height - 45, cvs.width, 5);
}

function drawPipes() {
    for (const p of pipes) {
        const pipeW = 52;

        // верхняя труба
        ctx.fillStyle = "#4ec04e";
        ctx.fillRect(p.x, 0, pipeW, p.topH);
        ctx.fillStyle = "#3a9a3a";
        ctx.fillRect(p.x - 2, p.topH - 10, pipeW + 4, 10);

        // нижняя труба
        const bottomY = p.topH + PIPE_GAP;
        ctx.fillStyle = "#4ec04e";
        ctx.fillRect(p.x, bottomY, pipeW, cvs.height - 40 - bottomY);
        ctx.fillStyle = "#3a9a3a";
        ctx.fillRect(p.x - 2, bottomY, pipeW + 4, 10);
    }
}

function drawBird() {
    const angle = Math.max(-0.5, Math.min(0.5, bird.vy * 0.08));

    ctx.save();
    ctx.translate(bird.x + bird.w / 2, bird.y + bird.h / 2);
    ctx.rotate(angle);

    if (bird.ready) {
        ctx.drawImage(birdImg, -bird.w / 2, -bird.h / 2, bird.w, bird.h);
    } else {
        ctx.fillStyle = "#ff0";
        ctx.fillRect(-bird.w / 2, -bird.h / 2, bird.w, bird.h);
    }

    ctx.restore();
}

function drawHUD() {
    ctx.fillStyle = "#000";
    ctx.font = "20px Verdana";
    ctx.fillText("Score: " + score, 10, 30);
    ctx.fillText("Best: " + best, 10, 55);

    if (gameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, cvs.width, cvs.height);

        ctx.fillStyle = "#fff";
        ctx.font = "28px Verdana";
        ctx.textAlign = "center";
        ctx.fillText("Game Over", cvs.width / 2, cvs.height / 2 - 20);
        ctx.font = "18px Verdana";
        ctx.fillText("Кликни или нажми пробел", cvs.width / 2, cvs.height / 2 + 10);
        ctx.textAlign = "start";
    }
}

// ----- игровой цикл -----
function loop(timestamp) {
    const delta = lastTime ? timestamp - lastTime : 16;
    lastTime = timestamp;

    if (!gameOver) {
        update(delta);
    }

    drawBackground();
    drawPipes();
    drawBird();
    drawHUD();

    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
