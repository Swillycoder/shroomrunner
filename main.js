const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = 512;
canvas.height = 608;

const map = new Image();
map.src = 'https://raw.githubusercontent.com/Swillycoder/shroomrunner/main/map.png';

const images = {
    shroom: 'https://raw.githubusercontent.com/Swillycoder/shroomrunner/main/shroomback.png',
    map: 'https://raw.githubusercontent.com/Swillycoder/shroomrunner/main/map.png',
    intro: 'https://raw.githubusercontent.com/Swillycoder/shroomrunner/main/intro.png',
    outro: 'https://raw.githubusercontent.com/Swillycoder/shroomrunner/main/outro.png',
    spores: 'https://raw.githubusercontent.com/Swillycoder/shroomrunner/main/spores.png',
    sporeprint: 'https://raw.githubusercontent.com/Swillycoder/shroomrunner/main/sporeprint.png',
    log: 'https://raw.githubusercontent.com/Swillycoder/shroomrunner/main/log32px.png',
    oil: 'https://raw.githubusercontent.com/Swillycoder/shroomrunner/main/oil.png',
    toxic: 'https://raw.githubusercontent.com/Swillycoder/shroomrunner/main/toxic.png',
    radiation: 'https://raw.githubusercontent.com/Swillycoder/shroomrunner/main/radiation.png',

};

const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
};

async function loadAllImages(imageSources) {
    const loadedImages = {};
    for (const [key, src] of Object.entries(imageSources)) {
        try {
            loadedImages[key] = await loadImage(src);
            console.log(`${key} loaded successfully`);
        } catch (error) {
            console.error(error);
        }
    }
    return loadedImages;
}

class Player {
    constructor (x,y, width, height, image) {
        this.x = x;
        this.y = y;
        this.image = image;
        this.width = width;
        this.height = height;
        this.speed = 3.8;
        this.frames = 0;
        this.frameDelay = 5;
        this.frameTimer = 0;
    }

    boundaries () {
        if (this.x <= 160) this.x = 160;
        if (this.x + this.width >= canvas.width - 160) this.x = canvas.width - this.width -160;
    }

    draw () {
        ctx.drawImage(
            this.image,
            this.width * this.frames,
            0,
            this.width,
            this.height,
            this.x,
            this.y,
            this.width,
            this.height
          );
    }
    
    update () {
        this.frameTimer++;
        if (this.frameTimer >= this.frameDelay) {
          this.frames++;
          this.frameTimer = 0;
        }
    
        if (this.frames >= 4) {
          this.frames = 0;
        }

        if (keys.KeyA) this.x -= this.speed;
        if (keys.KeyD) this.x += this.speed;
        if (keys.ArrowLeft) this.x -= this.speed;
        if (keys.ArrowRight) this.x += this.speed;

        this.boundaries();
        this.draw();
    }
}

class Obstacles {
    constructor(x,y,image) {
        this.x = x;
        this.y = y;
        this.image = image;
        this.speed = obstacleSpeed;
    }

    boundaries() {
        if (this.y > canvas.height) {
            this.x = 150 + Math.random() * 180;
            this.y = -Math.random() * 600;
            score += 2;
        }
    }

    draw() {
        ctx.drawImage(this.image, this.x, this.y);
    }
    update(){
        this.y += this.speed;
        this.boundaries();
        this.draw();
    }
}

class Rewards {
    constructor(x,y,image) {
        this.x = x;
        this.y = y;
        this.image = image;
        this.speed = rewardsSpeed;
    }

    boundaries() {
        if (this.y > canvas.height) {
            this.x = 150 + Math.random() * 180;
            this.y = -Math.random() * 600;
        }
    }

    draw() {
        ctx.drawImage(this.image, this.x, this.y);
    }
    update(){
        this.y += this.speed;
        this.boundaries();
        this.draw();
    }
}

const keys = {
    KeyA: false,
    KeyD: false,
    KeyP: false,
    Space: false,
    Enter: false,
    ArrowLeft: false,
    ArrowRight: false,
};

let score = 0;
let gameState = "introScreen"
let player;
let obstacles = [];
let rewards = [];
let loadedImages;
const obstacleCount = 5;
const rewardCount = 2;
let backgroundSpeed = 2;
let obstacleSpeed = 2;
let rewardsSpeed = 2;
let speedIncreaseTimer = 0;
let speedIncreaseInterval = 600;


function getRandomImage() {
    const randImage = [loadedImages.oil, loadedImages.toxic, loadedImages.radiation];
    return randImage[Math.floor(Math.random() * 3)];
}

function getRandomReward() {
    const randReward = [loadedImages.log, loadedImages.spores, loadedImages.sporeprint];
    return randReward[Math.floor(Math.random() * 3)];
}

function spawnObstacles() {
    for (let i = 0; i < obstacleCount; i++) {
        let x = 150 + Math.random() * 180;
        let y = -Math.random() * 600;
        obstacles.push(new Obstacles(x, y, getRandomImage()));
    }
}

function spawnRewards() {
    for (let i = 0; i < rewardCount; i++) {
        let x = 150 + Math.random() * 180; 
        let y = -(Math.random() * 600); 
        rewards.push(new Rewards(x, y, getRandomReward()));
    }
}

function isColliding(obj1, obj2) {
    let collision = (
        obj1.x < obj2.x + 25 &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + 25 &&
        obj1.y + obj1.height > obj2.y
    );
    return collision;
}

function collisionRewards() {
    for (let i = rewards.length - 1; i >= 0; i--) {
        let reward = rewards[i];

        if (isColliding(player, reward)) {
            score += 25;
            
            rewards.splice(i, 1);

            // Add a new reward in a new random location
            let x = 150 + Math.random() * 180;
            let y = -(Math.random() * 600);
            rewards.push(new Rewards(x, y, getRandomReward()));
        }
    }
}

function collisionObstacle() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obstacle = obstacles[i];

        if (isColliding(player, obstacle)) {
            gameState = "gameOverScreen"
            
            continue;
        }
    }
}

function gameLoop() {
    if (gameState === "introScreen") {
        introScreen();
    } else if (gameState === "gameScreen") {
        gameScreen();
    } else if (gameState === "gameOverScreen") {
        gameOverScreen();
    } 
    requestAnimationFrame(gameLoop);
}

function introScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'green'
    ctx.fillRect(0,0,canvas.width,canvas.height)
    ctx.drawImage(loadedImages.intro,0,0)

}

let backgroundY = 608;

function gameScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(map, 0, backgroundY);

    backgroundY += backgroundSpeed;
    if (backgroundY >= 0) {
        backgroundY = -608;
    }

    player.update();

    rewards.forEach(reward => {
        reward.update();
    })

    obstacles.forEach(obstacle => {
        obstacle.update();
    })

    speedIncreaseTimer++;
    if (speedIncreaseTimer >= speedIncreaseInterval) {
        backgroundSpeed += 0.3;
        obstacleSpeed += 0.3;
        rewardsSpeed += 0.3;
        speedIncreaseTimer = 0;
        //cap speed
        backgroundSpeed = Math.min(backgroundSpeed, 10);
        obstacleSpeed = Math.min(obstacleSpeed, 10);
        rewardsSpeed = Math.min(obstacleSpeed, 10);

        // Update existing obstacles' speed
        obstacles.forEach(obs => obs.speed = obstacleSpeed);
        rewards.forEach(rew => rew.speed = rewardsSpeed)
    }

    collisionRewards();
    collisionObstacle();

    ctx.font = '25px Impact';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(`${score}`, canvas.width/2, 577);
}


function gameOverScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    obstacles = [];
    rewards = [];
    //ctx.fillStyle = "rgb(231, 12, 12)";
    //ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(loadedImages.outro,0,0)
    ctx.font = '40px Impact'
    ctx.fillStyle = 'white'
    ctx.textAlign = 'center'
    ctx.fillText(`SCORE - ${score}`, canvas.width/2, 500)
    ctx.fillText("HIT P TO PLAY AGAIN", canvas.width/2, 550)
}

(async () => {
    console.log("Loading images...");
    loadedImages = await loadAllImages(images);
    console.log("All images loaded!");

    player = new Player(canvas.width/2 -25, 450, 32,32, loadedImages.shroom)
    
    gameLoop();
})();

document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = true;
    }
    if (gameState === "introScreen") {
        if (e.code === 'Space') {
            gameState = 'gameScreen';
            backgroundSpeed = 2;
            obstacleSpeed = 2;
            rewardsSpeed = 2;
            spawnRewards();
            spawnObstacles();
        }
    }
    if (gameState === "gameScreen") {
        if (e.code === 'Enter') {
            gameState = 'winScreen';
        }
    }

    if (gameState === "gameOverScreen") {
        if (e.code === 'KeyP') {
            gameState = 'introScreen';
            score = 0;
            obstacles.length = 0;
            rewards.length = 0;

        }
    }
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = false;
    }
});
