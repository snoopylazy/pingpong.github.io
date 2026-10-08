import './style.css';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const livesElement = document.getElementById('lives');
const levelElement = document.getElementById('level');
const startScreen = document.getElementById('startScreen');
const pauseScreen = document.getElementById('pauseScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const victoryScreen = document.getElementById('victoryScreen');
const levelCompleteScreen = document.getElementById('levelCompleteScreen');

const startBtn = document.getElementById('startBtn');
const resumeBtn = document.getElementById('resumeBtn');
const restartPauseBtn = document.getElementById('restartPauseBtn');
const restartBtn = document.getElementById('restartBtn');
const restartWinBtn = document.getElementById('restartWinBtn');
const nextLevelBtn = document.getElementById('nextLevelBtn');

const hudPauseBtn = document.getElementById('hudPauseBtn');
const hudRestartBtn = document.getElementById('hudRestartBtn');

const finalScoreElement = document.getElementById('finalScore');
const victoryScoreElement = document.getElementById('victoryScore');
const levelScoreElement = document.getElementById('levelScore');

// Game State
let score = 0;
let highScore = localStorage.getItem('breakoutHighScore') || 0;
let lives = 3;
let currentLevel = 0;
let isPlaying = false;
let isPaused = false;
let animationId;
const MAX_LEVELS = 50;

// Levels
const levels = [
  // Level 1: Standard block
  [
    [1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1]
  ],
  // Level 2: Checkerboard
  [
    [1,0,1,0,1,0,1,0,1],
    [0,1,0,1,0,1,0,1,0],
    [1,0,1,0,1,0,1,0,1],
    [0,1,0,1,0,1,0,1,0],
    [1,0,1,0,1,0,1,0,1]
  ],
  // Level 3: Space Invader / Heart / Diamond
  [
    [0,0,1,1,0,1,1,0,0],
    [0,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,0,0],
    [0,0,0,1,1,1,0,0,0],
    [0,0,0,0,1,0,0,0,0]
  ],
  // Level 4: Pyramid
  [
    [0,0,0,0,1,0,0,0,0],
    [0,0,0,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1]
  ],
  // Level 5: Smiley Face
  [
    [0,1,1,0,0,0,1,1,0],
    [1,1,1,1,0,1,1,1,1],
    [0,1,1,0,0,0,1,1,0],
    [0,0,0,0,0,0,0,0,0],
    [1,0,0,0,0,0,0,0,1],
    [0,1,0,0,0,0,0,1,0],
    [0,0,1,1,1,1,1,0,0]
  ],
  // Level 6: The Fortress
  [
    [9,9,1,1,2,1,1,9,9],
    [9,1,1,2,2,2,1,1,9],
    [1,1,2,2,0,2,2,1,1],
    [1,2,2,0,0,0,2,2,1],
    [2,2,0,0,0,0,0,2,2]
  ]
];

// Game Constants
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 12;
const BALL_RADIUS = 8;
const BRICK_COLUMN_COUNT = 9;
const BRICK_WIDTH = 74;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 10;
const BRICK_OFFSET_TOP = 60;
const BRICK_OFFSET_LEFT = 27;

const POWERUP_RADIUS = 12;
const LASER_WIDTH = 4;
const LASER_HEIGHT = 16;
const LASER_SPEED = 7;

// Colors
const PADDLE_COLOR = '#ec4899';
const PADDLE_GLOW = 'rgba(236, 72, 153, 0.5)';
const BALL_COLOR = '#e2e8f0';
const BALL_GLOW = 'rgba(226, 232, 240, 0.6)';
const BRICK_COLORS = [
  { fill: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)' }, // Red
  { fill: '#f97316', glow: 'rgba(249, 115, 22, 0.5)' }, // Orange
  { fill: '#eab308', glow: 'rgba(234, 179, 8, 0.5)' }, // Yellow
  { fill: '#22c55e', glow: 'rgba(34, 197, 94, 0.5)' }, // Green
  { fill: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)' }  // Blue
];

// Entities
const paddle = {
  x: canvas.width / 2 - PADDLE_WIDTH / 2,
  y: canvas.height - PADDLE_HEIGHT - 20,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
  dx: 7,
  isExpanded: false,
  isLaserActive: false
};

const ball = {
  x: canvas.width / 2,
  y: canvas.height - 40,
  radius: BALL_RADIUS,
  speed: 5,
  dx: 5,
  dy: -5
};

let bricks = [];
let powerUps = [];
let lasers = [];

// Timers
let laserInterval = null;
let expandTimeout = null;
let laserTimeout = null;

// Controls
let rightPressed = false;
let leftPressed = false;

document.addEventListener('keydown', (e) => {
  if (e.key === 'Right' || e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    rightPressed = true;
  } else if (e.key === 'Left' || e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    leftPressed = true;
  } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
    togglePause();
  } else if (e.key === 'r' || e.key === 'R') {
    startGame();
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'Right' || e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    rightPressed = false;
  } else if (e.key === 'Left' || e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    leftPressed = false;
  }
});

// Touch Controls
canvas.addEventListener('touchstart', handleTouch, { passive: false });
canvas.addEventListener('touchmove', handleTouch, { passive: false });

function handleTouch(e) {
  if (!isPlaying || isPaused) return;
  e.preventDefault(); // Prevent screen from scrolling
  
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  
  // Calculate touch position relative to the visually scaled canvas
  const touchX = touch.clientX - rect.left;
  
  // Map back to our internal 800px coordinate system
  const scaleX = canvas.width / rect.width;
  const gameX = touchX * scaleX;
  
  paddle.x = gameX - paddle.width / 2;
  
  // Keep paddle within bounds
  if (paddle.x < 0) paddle.x = 0;
  if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
}

function togglePause() {
  if (!isPlaying) return; // Only pause if actually playing
  
  isPaused = !isPaused;
  
  if (isPaused) {
    pauseScreen.classList.remove('hidden');
    hudPauseBtn.innerText = 'RESUME';
  } else {
    pauseScreen.classList.add('hidden');
    hudPauseBtn.innerText = 'PAUSE';
    draw(); // resume the loop
  }
}

// Initialization
function initBricks() {
  bricks = [];
  let layout;
  
  if (currentLevel < levels.length) {
    layout = levels[currentLevel];
  } else {
    // Procedurally generate levels 7 through 50
    layout = [];
    const numRows = Math.min(8, 4 + Math.floor(currentLevel / 5)); // Increase rows over time
    let hasBreakable = false;
    
    for (let r = 0; r < numRows; r++) {
      let row = [];
      for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
        let rand = Math.random();
        
        // Difficulty scaling
        let hardChance = Math.min(0.4, 0.1 + (currentLevel * 0.01));
        let wallChance = Math.min(0.25, 0.05 + (currentLevel * 0.005));
        let emptyChance = 0.2;
        
        let status = 1;
        if (rand < emptyChance) {
          status = 0;
        } else if (rand < emptyChance + wallChance) {
          status = 9;
        } else if (rand < emptyChance + wallChance + hardChance) {
          status = 2;
        }
        
        if (status === 1 || status === 2) hasBreakable = true;
        row.push(status);
      }
      layout.push(row);
    }
    
    // Ensure at least one breakable block exists
    if (!hasBreakable) {
      layout[0][Math.floor(BRICK_COLUMN_COUNT/2)] = 1;
    }
  }

  for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
    bricks[c] = [];
    for (let r = 0; r < layout.length; r++) {
      bricks[c][r] = { 
        x: 0, 
        y: 0, 
        status: layout[r][c],
        originalStatus: layout[r][c] // Track for crack visuals
      };
    }
  }
}

function resetBall() {
  ball.x = canvas.width / 2;
  ball.y = canvas.height - 40;
  // Increase base speed per level
  ball.speed = 5 + (currentLevel * 0.5);
  ball.dx = ball.speed * (Math.random() > 0.5 ? 1 : -1);
  ball.dy = -ball.speed;
  paddle.x = canvas.width / 2 - paddle.width / 2;
}

// Drawing Functions
function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = BALL_COLOR;
  ctx.shadowColor = BALL_GLOW;
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.closePath();
  ctx.shadowBlur = 0; // reset
}

function drawPaddle() {
  ctx.beginPath();
  // Rounded corners
  const radius = 6;
  ctx.moveTo(paddle.x + radius, paddle.y);
  ctx.lineTo(paddle.x + paddle.width - radius, paddle.y);
  ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y, paddle.x + paddle.width, paddle.y + radius);
  ctx.lineTo(paddle.x + paddle.width, paddle.y + paddle.height - radius);
  ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y + paddle.height, paddle.x + paddle.width - radius, paddle.y + paddle.height);
  ctx.lineTo(paddle.x + radius, paddle.y + paddle.height);
  ctx.quadraticCurveTo(paddle.x, paddle.y + paddle.height, paddle.x, paddle.y + paddle.height - radius);
  ctx.lineTo(paddle.x, paddle.y + radius);
  ctx.quadraticCurveTo(paddle.x, paddle.y, paddle.x + radius, paddle.y);
  
  ctx.fillStyle = PADDLE_COLOR;
  ctx.shadowColor = PADDLE_GLOW;
  ctx.shadowBlur = paddle.isExpanded ? 25 : 15;
  ctx.fill();
  ctx.closePath();
  ctx.shadowBlur = 0;
  
  // Draw laser cannons if active
  if (paddle.isLaserActive) {
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
    ctx.shadowBlur = 10;
    
    // Left cannon
    ctx.fillRect(paddle.x + 8, paddle.y - 4, 6, 8);
    // Right cannon
    ctx.fillRect(paddle.x + paddle.width - 14, paddle.y - 4, 6, 8);
    
    ctx.shadowBlur = 0;
  }
}

function drawBricks() {
  for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
    for (let r = 0; r < bricks[c].length; r++) {
      if (bricks[c][r].status > 0 || bricks[c][r].status === 9) {
        const brickX = (c * (BRICK_WIDTH + BRICK_PADDING)) + BRICK_OFFSET_LEFT;
        const brickY = (r * (BRICK_HEIGHT + BRICK_PADDING)) + BRICK_OFFSET_TOP;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;
        
        ctx.beginPath();
        const radius = 4;
        ctx.moveTo(brickX + radius, brickY);
        ctx.lineTo(brickX + BRICK_WIDTH - radius, brickY);
        ctx.quadraticCurveTo(brickX + BRICK_WIDTH, brickY, brickX + BRICK_WIDTH, brickY + radius);
        ctx.lineTo(brickX + BRICK_WIDTH, brickY + BRICK_HEIGHT - radius);
        ctx.quadraticCurveTo(brickX + BRICK_WIDTH, brickY + BRICK_HEIGHT, brickX + BRICK_WIDTH - radius, brickY + BRICK_HEIGHT);
        ctx.lineTo(brickX + radius, brickY + BRICK_HEIGHT);
        ctx.quadraticCurveTo(brickX, brickY + BRICK_HEIGHT, brickX, brickY + BRICK_HEIGHT - radius);
        ctx.lineTo(brickX, brickY + radius);
        ctx.quadraticCurveTo(brickX, brickY, brickX + radius, brickY);
        
        let colorObj;
        if (bricks[c][r].status === 9) {
          colorObj = { fill: '#64748b', glow: 'rgba(100, 116, 139, 0.5)' }; // Unbreakable Slate Grey
        } else if (bricks[c][r].status === 2) {
          colorObj = { fill: '#d946ef', glow: 'rgba(217, 70, 239, 0.8)' }; // Hard Block Purple
        } else {
          colorObj = BRICK_COLORS[r % BRICK_COLORS.length]; // Normal colors
        }
        
        ctx.fillStyle = colorObj.fill;
        ctx.shadowColor = colorObj.glow;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.closePath();
        
        // Add crack line for broken hard block
        if (bricks[c][r].status === 1 && colorObj === BRICK_COLORS[r % BRICK_COLORS.length] && bricks[c][r].originalStatus === 2) {
            ctx.beginPath();
            ctx.moveTo(brickX + 10, brickY + 5);
            ctx.lineTo(brickX + BRICK_WIDTH/2, brickY + BRICK_HEIGHT/2);
            ctx.lineTo(brickX + BRICK_WIDTH - 15, brickY + 8);
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.closePath();
        }
        
        ctx.shadowBlur = 0;
      }
    }
  }
}

function drawPowerUps() {
  for (let i = 0; i < powerUps.length; i++) {
    const p = powerUps[i];
    ctx.beginPath();
    ctx.arc(p.x, p.y, POWERUP_RADIUS, 0, Math.PI * 2);
    
    if (p.type === 'expand') {
      ctx.fillStyle = '#3b82f6';
      ctx.shadowColor = 'rgba(59, 130, 246, 0.8)';
    } else if (p.type === 'laser') {
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
    } else if (p.type === 'heart') {
      ctx.fillStyle = '#10b981'; // emerald green
      ctx.shadowColor = 'rgba(16, 185, 129, 0.8)';
    }
    
    ctx.shadowBlur = 15;
    ctx.fill();
    
    // Inner styling
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 0;
    ctx.font = '14px Outfit';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let icon = '';
    if (p.type === 'expand') icon = '↔';
    else if (p.type === 'laser') icon = '⚡';
    else if (p.type === 'heart') icon = '♥';
    ctx.fillText(icon, p.x, p.y + 1);
    ctx.closePath();
  }
}

function drawLasers() {
  for (let i = 0; i < lasers.length; i++) {
    const l = lasers[i];
    ctx.beginPath();
    ctx.rect(l.x, l.y, LASER_WIDTH, LASER_HEIGHT);
    ctx.fillStyle = '#f87171';
    ctx.shadowColor = 'rgba(239, 68, 68, 1)';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
  }
}

function checkWinCondition() {
  let win = true;
  for (let c2 = 0; c2 < BRICK_COLUMN_COUNT; c2++) {
    for (let r2 = 0; r2 < bricks[c2].length; r2++) {
      if (bricks[c2][r2].status > 0 && bricks[c2][r2].status !== 9) {
        win = false;
        break;
      }
    }
  }
  
  if (win) {
    isPlaying = false;
    cancelAnimationFrame(animationId);
    clearInterval(laserInterval);
    clearTimeout(expandTimeout);
    clearTimeout(laserTimeout);
    
    currentLevel++;
    if (currentLevel >= MAX_LEVELS) {
      gameWin();
    } else {
      levelComplete();
    }
  }
}

function addScore(points) {
  score += points;
  scoreElement.innerText = score;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('breakoutHighScore', highScore);
    highScoreElement.innerText = highScore;
  }
}

// Game Logic
function collisionDetection() {
  for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
    for (let r = 0; r < bricks[c].length; r++) {
      const b = bricks[c][r];
      if (b.status > 0 || b.status === 9) {
        if (
          ball.x + ball.radius > b.x &&
          ball.x - ball.radius < b.x + BRICK_WIDTH &&
          ball.y + ball.radius > b.y &&
          ball.y - ball.radius < b.y + BRICK_HEIGHT
        ) {
          ball.dy = -ball.dy;
          
          if (b.status === 9) {
            // Just bounce on unbreakable walls
          } else {
            b.status--;
            if (b.status === 0) {
              addScore(10);
              
              // Spawn power-up (15% chance)
              if (Math.random() < 0.15) {
                const rand = Math.random();
                let type = 'expand';
                if (rand < 0.33) type = 'laser';
                else if (rand < 0.66) type = 'heart';
                
                powerUps.push({
                  x: b.x + BRICK_WIDTH / 2,
                  y: b.y + BRICK_HEIGHT / 2,
                  type: type,
                  dy: 2.5
                });
              }
              checkWinCondition();
            } else {
              addScore(5); // Small points for cracking a hard block
            }
          }
          
          // Increase speed slightly
          ball.speed += 0.05;
          const currentSpeed = Math.sqrt(ball.dx*ball.dx + ball.dy*ball.dy);
          ball.dx = (ball.dx / currentSpeed) * ball.speed;
          ball.dy = (ball.dy / currentSpeed) * ball.speed;
        }
      }
    }
  }
}

function updatePowerUps() {
  for (let i = 0; i < powerUps.length; i++) {
    const p = powerUps[i];
    p.y += p.dy;
    
    // Check paddle collision
    if (
      p.y + POWERUP_RADIUS > paddle.y &&
      p.y - POWERUP_RADIUS < paddle.y + paddle.height &&
      p.x + POWERUP_RADIUS > paddle.x &&
      p.x - POWERUP_RADIUS < paddle.x + paddle.width
    ) {
      activatePowerUp(p.type);
      powerUps.splice(i, 1);
      i--;
    } else if (p.y > canvas.height) {
      // Remove if falls off
      powerUps.splice(i, 1);
      i--;
    }
  }
}

function activatePowerUp(type) {
  if (type === 'heart') {
    lives++;
    livesElement.innerText = lives;
  } else if (type === 'expand') {
    paddle.isExpanded = true;
    
    // Adjust x if expanding near walls
    const newWidth = PADDLE_WIDTH * 1.5;
    const center = paddle.x + paddle.width / 2;
    paddle.width = newWidth;
    paddle.x = center - newWidth / 2;
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;

    clearTimeout(expandTimeout);
    expandTimeout = setTimeout(() => {
      paddle.isExpanded = false;
      const oldCenter = paddle.x + paddle.width / 2;
      paddle.width = PADDLE_WIDTH;
      paddle.x = oldCenter - PADDLE_WIDTH / 2;
    }, 10000); // 10 seconds
  } else if (type === 'laser') {
    paddle.isLaserActive = true;
    clearInterval(laserInterval);
    clearTimeout(laserTimeout);
    
    laserInterval = setInterval(() => {
      if (isPlaying && !isPaused) {
        lasers.push({ x: paddle.x + 10, y: paddle.y });
        lasers.push({ x: paddle.x + paddle.width - 14, y: paddle.y });
      }
    }, 400);
    
    laserTimeout = setTimeout(() => {
      paddle.isLaserActive = false;
      clearInterval(laserInterval);
    }, 6000); // 6 seconds
  }
}

function updateLasers() {
  for (let i = 0; i < lasers.length; i++) {
    const l = lasers[i];
    l.y -= LASER_SPEED;
    
    let laserHit = false;
    
    // Check brick collision
    for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
      for (let r = 0; r < bricks[c].length; r++) {
        const b = bricks[c][r];
        if (b.status > 0 || b.status === 9) {
          if (
            l.x > b.x &&
            l.x < b.x + BRICK_WIDTH &&
            l.y > b.y &&
            l.y < b.y + BRICK_HEIGHT
          ) {
            laserHit = true;
            if (b.status !== 9) {
              b.status--;
              if (b.status === 0) {
                addScore(10);
                checkWinCondition();
              } else {
                addScore(5);
              }
            }
            break;
          }
        }
      }
      if (laserHit) break;
    }
    
    if (laserHit || l.y < 0) {
      lasers.splice(i, 1);
      i--;
    }
  }
}

function movePaddle() {
  if (rightPressed && paddle.x < canvas.width - paddle.width) {
    paddle.x += paddle.dx;
  } else if (leftPressed && paddle.x > 0) {
    paddle.x -= paddle.dx;
  }
}

function moveBall() {
  // Wall collisions
  if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
    ball.dx = -ball.dx;
  }
  if (ball.y + ball.dy < ball.radius) {
    ball.dy = -ball.dy;
  } else if (ball.y + ball.dy > canvas.height - ball.radius) {
    // Bottom collision (miss)
    lives--;
    livesElement.innerText = lives;
    if (lives === 0) {
      gameOver();
    } else {
      resetBall();
    }
  }

  // Paddle collision
  if (
    ball.y + ball.radius > paddle.y && 
    ball.y - ball.radius < paddle.y + paddle.height &&
    ball.x + ball.radius > paddle.x && 
    ball.x - ball.radius < paddle.x + paddle.width
  ) {
    // Calculate hit point for angle
    let hitPoint = ball.x - (paddle.x + paddle.width / 2);
    // Normalize hit point (-1 to 1)
    hitPoint = hitPoint / (paddle.width / 2);
    
    // Calculate new angle (-60 deg to 60 deg)
    const angle = hitPoint * (Math.PI / 3);
    
    ball.dx = ball.speed * Math.sin(angle);
    ball.dy = -ball.speed * Math.cos(angle);
    
    // Prevent getting stuck inside paddle
    ball.y = paddle.y - ball.radius;
  }

  ball.x += ball.dx;
  ball.y += ball.dy;
}

function draw() {
  if (!isPlaying) return;
  if (isPaused) return;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBricks();
  drawPowerUps();
  drawLasers();
  drawBall();
  drawPaddle();
  
  collisionDetection();
  updatePowerUps();
  updateLasers();
  movePaddle();
  moveBall();

  animationId = requestAnimationFrame(draw);
}

// State Management
function startGame() {
  score = 0;
  lives = 3;
  currentLevel = 0;
  isPaused = false;
  hudPauseBtn.innerText = 'PAUSE';
  scoreElement.innerText = score;
  livesElement.innerText = lives;
  levelElement.innerText = currentLevel + 1;
  
  startLevel();
}

function startLevel() {
  powerUps = [];
  lasers = [];
  paddle.isExpanded = false;
  paddle.isLaserActive = false;
  paddle.width = PADDLE_WIDTH;
  clearInterval(laserInterval);
  clearTimeout(expandTimeout);
  clearTimeout(laserTimeout);
  
  initBricks();
  resetBall();
  
  startScreen.classList.add('hidden');
  pauseScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  victoryScreen.classList.add('hidden');
  levelCompleteScreen.classList.add('hidden');
  
  levelElement.innerText = currentLevel + 1;
  
  isPlaying = true;
  isPaused = false;
  draw();
}

function levelComplete() {
  levelScoreElement.innerText = score;
  levelCompleteScreen.classList.remove('hidden');
}

function gameOver() {
  isPlaying = false;
  isPaused = false;
  cancelAnimationFrame(animationId);
  clearInterval(laserInterval);
  clearTimeout(expandTimeout);
  clearTimeout(laserTimeout);
  
  finalScoreElement.innerText = score;
  gameOverScreen.classList.remove('hidden');
}

function gameWin() {
  isPlaying = false;
  isPaused = false;
  cancelAnimationFrame(animationId);
  clearInterval(laserInterval);
  clearTimeout(expandTimeout);
  clearTimeout(laserTimeout);
  
  victoryScoreElement.innerText = score;
  victoryScreen.classList.remove('hidden');
}

// Event Listeners
startBtn.addEventListener('click', startGame);
resumeBtn.addEventListener('click', togglePause);
restartPauseBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
restartWinBtn.addEventListener('click', startGame);
nextLevelBtn.addEventListener('click', startLevel);

hudPauseBtn.addEventListener('click', togglePause);
hudRestartBtn.addEventListener('click', startGame);

// Initial setup
highScoreElement.innerText = highScore;
initBricks();
drawBricks();
drawPaddle();
