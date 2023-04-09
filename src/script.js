const canvas = document.getElementById('canvas1'); //element used to connect the html canvas to a javascript version of the canvas
const ctx = canvas.getContext('2d'); //element used to use the 2d available methods of the canvas

canvas.width = 900; //using here the same width and height as the html file to adjust the canvas correctly
canvas.height = 600; // *** AJUST TO FIT ON THE SIDE OF THE SCREEN ***

//global variables (just to make it a littile bit easier to read) will be declared here:
const cellSize = 100;
const cellGap = 3;

const gameGrid = []; //array used to store the canvas "cells" information and objects
const defenders = []; //array used to store all the current defenders
const enemies = []; //array used to store all the current enemies on the grid
const enemyPositions = []; //array used to store the current positions of the enemies
const projectiles = []; //array used to store the various projectiles
const resources = []; //array used to store all the resources
const winningScore = 10; //winning score used to let the game finish whenever the player gets to that value

let enemiesInterval = 600; //variable used to control the "flow" of the enemies
let numberOfResources = 300;
let score = 0;
let frame = 0;
let gameOver = false; //variable used to determine if the player has lost or not

//MOUSE will be created and developed here:
const mouse = { //mouse object used to handle the mouse movement and interaction
    x : 10,
    y : 10,
    width: 0.1,
    height: 0.1,
}
//The canvas.getBoundingClientRect() method returns a "DOMRect" object providing information
// about the size of an element and its position relative to the viewport.
let canvasPosition = canvas.getBoundingClientRect();
canvas.addEventListener('mousemove', function (e){ //method to determine x and y positions of the mouse for Mouse Movement
    mouse.x = e.x - canvasPosition.left;
    mouse.y = e.y - canvasPosition.top;
})
canvas.addEventListener('mouseleave', function(){
    mouse.x = undefined;
    mouse.y = undefined;
})

//GAME-BOARD will be created and developed here:
const controlsBar = { //controlsBar object to make a small bar at the top to contain the essentials for the game
    width: canvas.width,
    height: cellSize,
}
class Cell{ //class made for single cell creation for the Canvas
    constructor(x,y) { //a method of the Cell class to retrieve and set useful variables
        this.x = x;
        this.y = y;
        this.width = cellSize;
        this.height = cellSize;
    }
    draw(){ //this method is responsible for drawing and positioning the objects in their respective cells
        if (mouse.x && mouse.y && collision(this,mouse)){ //check used for the cell interaction with the mouse
            ctx.strokeStyle = 'black';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}
function createGrid(){ //method used to create the full on "grid" that will be used for the character positioning
    for(let y = cellSize; y < canvas.height; y += cellSize){
        for (let x = 0; x < canvas.width; x += cellSize){
            gameGrid.push(new Cell(x,y)); //this will add the new "Cell" created onto the gameGrid array where all the cells are stored
        }
    }
}
createGrid(); //use the function to actually draw the grid lines
function handleGameGrid(){ //very simple function to draw the individual cells fo the grid
    for(let i = 0; i < gameGrid.length; i++){
        gameGrid[i].draw();
    }
}
//PROJECTILE development here:
class Projectile{
    constructor(x,y) {
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 10;
        this.power = 20; //determines the power of the projectile, so how much damage it inflicts
        this.speed = 5; //speed at which the projectile runs
    }
    update(){
        this.x += this.speed;
    }
    draw(){ //FOR NOW it draws a small circle for the projectile
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width,0,Math.PI * 2);
        ctx.fill();
    }
}
function handleProjectiles(){ //handles all the individual projectiles
    for (let i = 0; i < projectiles.length; i++){
        projectiles[i].update();
        projectiles[i].draw();

        for(let j = 0; j < enemies.length; j++){ //projectile damage is handled here
            if (enemies[j] && projectiles[i] && collision(projectiles[i], enemies[j])){
                enemies[j].health -= projectiles[i].power;
                projectiles.splice(i,1);
                i--;
            }
        }

        if (projectiles[i] && projectiles[i].x > canvas.width -cellSize){ //this control prevents the projectiles from hitting the enemies where they spawn by limiting the projectile range
            projectiles.splice(i,1);
            i--;
        }
    }
}
//DEFENDER development here:
class Defender{
    constructor(x,y) { //just like a java constructor wow!
        this.x = x;
        this.y = y;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.shooting = false; //shooting used when an enemy is detected
        this.health = 100; //defender's health
        this.projectiles = []; // used to store the specific projectile used by the defender
        this.timer = 0; //defines the "shooting rate" of the defender
    }
    draw(){ // draw method to actually draw the defender : )
        ctx.fillStyle = 'purple';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'gold'; //health display portion
        ctx.font = '30px Delicious Handrawn';
        ctx.fillText(Math.floor(this.health),this.x + 25,this.y + 30);
    }
    update(){ //method for the projectile shooting
        if(this.shooting){
            this.timer++;
            if(this.timer % 100 === 0){ // timer used to shoot constantly the projectiles, modify this to change the FIRE RATE
                projectiles.push(new Projectile(this.x + 70,this.y + 50));
            }
        } else {
            this.timer = 0;
        }
    }
}
canvas.addEventListener('click', function (){ // function that is used to manage the defender
    const gridPositionX = mouse.x - (mouse.x % cellSize) + cellGap;
    const gridPositionY = mouse.y - (mouse.y % cellSize) + cellGap;
    if (gridPositionY < cellSize) return; // used to avoid placing defenders on the top selection bar
    for (let i = 0; i < defenders.length; i++){ //small check to check if there are already any defenders on the chosen position
        if (defenders[i].x === gridPositionX && defenders[i].y === gridPositionY) return;
    }
    let defenderCost = 100;
    if (numberOfResources >= defenderCost){ //if the player has enough money then he can place the defender!
        defenders.push(new Defender(gridPositionX,gridPositionY));
        numberOfResources -= defenderCost;
    }
})
function handleDefenders(){ // draws and handles the various defenders on the grid
    for(let i = 0; i < defenders.length; i++){
        defenders[i].draw();
        defenders[i].update();
        if (enemyPositions.indexOf(defenders[i].y) !== -1){ //check used to control the shooting ability of the defender
            defenders[i].shooting = true;
        } else {
            defenders[i].shooting = false;
        }
        for (let j = 0; j < enemies.length; j++){ //check used to check if there is a collision made between the defender and the enemy
            if(defenders[i] && collision(defenders[i], enemies[j])){ //if the collision happens
                enemies[j].movement = 0;
                defenders[i].health -= 0.2; //health of the defender will be reduced
            }
            if(defenders[i] && defenders[i].health <= 0){ //when the defender reaches 0 health it gets removed from the grid
                defenders.splice(i, 1);
                i--;
                enemies[j].movement = enemies[j].speed; // lets the enemy continue moving at his original speed after killing the defender
            }
        }
    }
}
//ENEMIES development here:
class Enemy  {
    constructor(verticalPosition) {
        this.x = canvas.width;
        this.y = verticalPosition;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.speed = Math.random() * 0.2 + 0.6; // attributed speed that is randomly generated for the enemy
        this.movement = this.speed;
        this.health = 100;
        this.maxHealth = this.health;
    }
    update(){ //updates the position of the enemy
        this.x -= this.movement;
    }
    draw(){
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'black'; //health display portion
        ctx.font = '30px Delicious Handrawn';
        ctx.fillText(Math.floor(this.health),this.x + 25,this.y + 30);
    }
}
function handleEnemies(){ //method to update and handle the ememies in the grid
    for (let i = 0; i < enemies.length; i++){
        enemies[i].update();
        enemies[i].draw();
        if(enemies[i].x < 0){ //controls whenever an enemy passes the left of the canvas, then the player has lost the game
            gameOver = true;
        }
        if(enemies[i].health <= 0){//checks if the enemy's health is equal to 0, then it removes it from the grid
            let gainedResources = enemies[i].maxHealth/10; // used to give back to the player resources according to the damage inflicted
            numberOfResources += gainedResources;
            score += gainedResources;
            const findThisIndex = enemyPositions.indexOf(enemies[i].y);
            enemyPositions.splice(findThisIndex,1);
            enemies.splice(i,1);
            i--;
        }
    }
    if (frame % enemiesInterval === 0 && score < winningScore){// determines the spawn rate of each enemy
        let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap; //positions randomly the enemy on any given row
        enemies.push(new Enemy(verticalPosition)); //adds a new enemy
        enemyPositions.push(verticalPosition);
        if (enemiesInterval > 120) enemiesInterval -= 50; //shortens the flow-rate used mainly to control the games DIFFICULTY
    }
}
//RESOURCES development here:
const amounts = [20,30,40]; // value used for descending resources
class Resource{
    constructor() {
        this.x = Math.random() * (canvas.width - cellSize);
        this.y = (Math.floor(Math.random() * 5) + 1) * cellSize + 25;
        this.width = cellSize * 0.6;
        this.height = cellSize * 0.6;
        this.amount = amounts[Math.floor(Math.random() * amounts.length)]; // method to assign a value of the resource randomly from the array of possible
    }
    draw(){
        ctx.fillStyle = 'yellow';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'black';
        ctx.font = '20px Delicious Handrawn';
        ctx.fillText(this.amount, this.x + 15, this.y + 25);
    }
}
function handleResources(){ //handling of the resources
    if(frame % 500 === 0 && score < winningScore){ // check for the winning score
        resources.push(new Resource());
    }
    for(let i = 0; i < resources.length; i++){
        resources[i].draw();
        if(resources[i] && mouse.x && mouse.y && collision(resources[i], mouse)){
            numberOfResources += resources[i].amount;
            resources.splice(i, 1);
            i--;
        }
    }
}
//UTILITIES development here:
function handleGameStatus(){ // small method to display the available resources on the top bar of the canvas
    ctx.fillStyle = 'gold';
    ctx.font = '30px Delicious Handrawn';
    ctx.fillText('Score: ' + score,20,40);
    ctx.fillText('Resources: ' + numberOfResources,20,80);
    if(gameOver){ //method to display the Game Over Screen at the end of the game!
        ctx.fillStyle = 'black';
        ctx.font = '120px Delicious Handrawn';
        ctx.fillText('GAME OVER', 220, 360);
    }
    if (score >= winningScore && enemies.length === 0){ //controls if the player has actually got the winning score
        ctx.fillStyle = 'black';
        ctx.font = '60px Delicious Handrawn';
        ctx.fillText('LEVEL COMPLETE', 260,320);
        ctx.font = '30px Delicious Handrawn';
        ctx.fillText('You win with ' + score + 'points', 264,360);
    }
}
function animate(){ //function used to "re-draw" the element of the canvas making it seem "animated"
    ctx.clearRect(0,0, canvas.width,canvas.height); // method used to "clear up" the unnecessary stuff that constantly gets drawn
    ctx.fillStyle = 'purple';
    ctx.fillRect(0,0,controlsBar.width,controlsBar.height);
    handleGameGrid();
    handleDefenders();
    handleResources();
    handleProjectiles();
    handleEnemies();
    handleGameStatus();
    frame++;
    if (!gameOver) requestAnimationFrame(animate); // method used to create an animation "loop" effect using recursion : )
}
animate();

function collision (first, second){//method used to make two objects collide
    if (    !( first.x > second.x + second.width || //horizontal collision check
                first.x + first.width < second.x ||
                first.y > second.y + second.height || //vertical collision check
                first.y + first.height < second.y)
    ) {
        return true;
    }
}

window.addEventListener('resize', function(){ //method used to correctly handle the resize function of the web window
    canvasPosition = canvas.getBoundingClientRect();
})
