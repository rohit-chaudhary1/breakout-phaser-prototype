var levels = [
    [
        [1, 1, 1, 1, 1],
        [1, 1, 0, 1, 1],
        [1, 1, 1, 1, 1]
    ],
    [
        [1, 1, 0, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1]
    ],
    [
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1]
    ]
];

var game = new Phaser.Game(
    480,
    320,
    Phaser.AUTO,
    null,
    {
        preload: preload,
        create: create,
        update: update
    }
)

// assets
var ASSET_URL = "./assets/";
var ASSET_BALL = ASSET_URL + "ymu0rbi.png";
var ASSET_PADDLE = ASSET_URL + "FLIVmxd.png";
var ASSET_BRICK = ASSET_URL + "TciyN4f.png";
var ASSET_SS_WOBBLE = ASSET_URL + "uQEpvVK.png";
var ASSET_BUTTON = ASSET_URL + "LOMoTud.png";

// globals
var ball,
    paddle,
    bricks,
    newBrick,
    brickInfo,
    scoreText,
    score = 0,
    lives = 1,
    livesText,
    levelText,
    gameWonText,
    gameOverText,
    lifeLostText,
    textStyle = { font: '18px Arial', fill: '#0095DD' },
    playing = false,
    startButton,
    currentLevel = 1;

function preload() {
    // Scaling
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;

    // Stage background color
    game.stage.backgroundColor = "#eee";
    //game.load.crossOrigin = true;
    // Load assets
    game.load.spritesheet("ball", ASSET_SS_WOBBLE, 20, 20);
    game.load.spritesheet("button", ASSET_BUTTON, 120, 40);
    game.load.image("paddle", ASSET_PADDLE);
    game.load.image("brick", ASSET_BRICK);
}

function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.arcade.checkCollision.down = false;

    // add sprites to game view
    ball = game.add.sprite(game.world.width * 0.5, game.world.height - 25, "ball");
    paddle = game.add.sprite(game.world.width * 0.5, game.world.height - 5, "paddle");
    startButton = game.add.button(game.world.width * 0.5, game.world.height * 0.5, "button", startGame, this, 1, 0, 2);
    ball.anchor.set(0.5, 1);
    paddle.anchor.set(0.5, 1);
    startButton.anchor.set(0.5);

    // animations
    ball.animations.add('wobble', [0, 1, 0, 2, 0, 1, 0, 2, 0], 24);

    // enable physics on game objects
    game.physics.enable(ball, Phaser.Physics.ARCADE);
    game.physics.enable(paddle, Phaser.Physics.ARCADE);


    // ball physics
    // ball.body.velocity.set(150, -150); => Now handled in startGame method
    ball.body.collideWorldBounds = true; // stay within the game world
    ball.body.bounce.set(1);
    ball.checkWorldBounds = true;
    ball.events.onOutOfBounds.add(ballLeaveScreen, this);

    // paddle physics
    paddle.body.immovable = true;

    initBricks();

    /************** Text on screen ***********************/
    // Score 
    scoreText = game.add.text(5, 5, 'Points: 0', textStyle);
    // Lives 
    livesText = game.add.text(game.world.width - 5, 5, "Lives: " + lives, textStyle);
    livesText.anchor.set(1, 0);
    // Life Lost
    lifeLostText = game.add.text(game.world.width >> 1, game.world.height * 0.5, 'Life lost, click to continue', textStyle);
    lifeLostText.anchor.set(0.5);
    lifeLostText.visible = false;
    // Level Text
    levelText = game.add.text(game.world.width >> 1, 5, "Level: " + currentLevel, textStyle);
    levelText.anchor.set(0.5, 0);

    // game won text
    gameWonText = game.add.text(game.world.width >> 1, game.world.height >> 1, "Game Won!", textStyle);
    gameWonText.anchor.set(0.5);
    gameWonText.visible = false;
    // game over text
    gameOverText = game.add.text(game.world.width >> 1, game.world.height >> 1, "Game Over!", textStyle);
    gameOverText.anchor.set(0.5);
    gameOverText.visible = false;
}

function update() {
    game.physics.arcade.collide(ball, paddle, ballHitPaddle);
    game.physics.arcade.collide(ball, bricks, ballHitBrick);
    if (!game.input.activePointer.withinGame && playing) {
        game.paused = true;
        game.input.onDown.addOnce(function () {
            game.paused = false;
        }, self);
    } else {

    }
    if (playing) {
        paddle.x = game.input.x || game.world.width * 0.5;
    }
}

function initBricks() {
    brickInfo = {
        width: 50,
        height: 20,
        count: {
            row: 3,
            col: 5
        },
        offset: {
            top: 50,
            left: 120
        },
        padding: 10
    };
    bricks = game.add.group();
    var bricksFormation = levels[currentLevel - 1];
    for (c = 0; c < brickInfo.count.col; c++) {
        for (r = 0; r < brickInfo.count.row; r++) {
            // create new brick and add it to the group
            var brickX = (c * (brickInfo.width + brickInfo.padding)) + brickInfo.offset.left;
            var brickY = (r * (brickInfo.height + brickInfo.padding)) + brickInfo.offset.top;
            if (bricksFormation[r][c] === 1) {
                newBrick = game.add.sprite(brickX, brickY, 'brick');
                game.physics.enable(newBrick, Phaser.Physics.ARCADE);
                newBrick.body.immovable = true;
                newBrick.anchor.set(0.5);
                bricks.add(newBrick);
            }
        }
    }
}

function ballHitPaddle() {
    ball.animations.play('wobble');
    ball.body.velocity.x = -1 * 5 * (paddle.x - ball.x);
}

function ballHitBrick(ball, brick) {
    var killTween = game.add.tween(brick.scale);
    killTween.to({ x: 0, y: 0 }, 200, Phaser.Easing.Linear.None);
    killTween.onComplete.addOnce(function () {
        brick.kill();
    }, this);
    killTween.start();
    score += 10;
    scoreText.setText('Points: ' + score);

    var totalBricks = bricks.children.length;
    var aliveBricks = 0;
    for (i = 0; i < totalBricks; i++) {
        if (bricks.children[i].alive) {
            aliveBricks++;
        }
    }

    if (aliveBricks == 1) { // last one got hit but alive property will be updated in next update cycle
        loadNextLevel();
    }
}

function loadNextLevel() {
    if (currentLevel === levels.length) {
        gameWonText.visible = true;
        game.paused = true;
        return;
    }
    currentLevel++;
    levelText.setText("Level: " + currentLevel);

    initBricks();
}

function ballLeaveScreen() {
    lives--;
    if (lives) {
        livesText.setText('Lives: ' + lives);
        lifeLostText.visible = true;
        ball.reset(game.world.width * 0.5, game.world.height - 25);
        paddle.reset(game.world.width * 0.5, game.world.height - 5);
        game.input.onDown.addOnce(function () {
            lifeLostText.visible = false;
            ball.body.velocity.set(150, -150);
        }, this);
    } else {
        gameOverText.visible = true;
        game.paused = true;
    }
}

function startGame() {
    startButton.destroy();
    ball.body.velocity.set(150, -150);
    playing = true;
}
