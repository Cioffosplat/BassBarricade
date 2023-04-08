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
let numberOfResources = 300;
let frame = 0;

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
//DEFENDER development here:
class Defender{
    constructor(x,y) { //just like a java constructor wow!
        this.x = x;
        this.y = y;
        this.width = cellSize;
        this.height = cellSize;
        this.shooting = false; //shooting used when an enemy is detected
        this.health = 100; //defender's health
        this.projectiles = []; // used to store the specific projectile used by the defender
        this.timer = 0; //defines the "shooting rate" of the defender
    }
    draw(){ // draw method to actually draw the defender : )
        ctx.fillStyle = 'purple';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'gold'; //health display portion
        ctx.font = '30px Arial';
        ctx.fillText(Math.floor(this.health),this.x + 25,this.y + 30);
    }
}
canvas.addEventListener('click', function (){ // function that is used to manage the defender
    const gridPositionX = mouse.x - (mouse.x % cellSize);
    const gridPositionY = mouse.y - (mouse.y % cellSize);
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
function handleDefenders(){
    for(let i = 0; i < defenders.length; i++){
        defenders[i].draw();
    }
}
//ENEMIES development here:
class Enemy  {
    constructor(verticalPosition) {
        this.x = canvas.width;
        this.y = verticalPosition;
        this.width = cellSize;
        this.height = cellSize;
        this.speed = Math.random() * 0.2 + 0.4; // attributed speed that is randomly generated for the enemy
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
        ctx.font = '30px Arial';
        ctx.fillText(Math.floor(this.health),this.x + 25,this.y + 30);
    }
}
function handleEnemies(){ //method to update and handle the ememies in the grid
    for (let i = 0; i < enemies.length; i++){
        enemies[i].update();
        enemies[i].draw();
    }
    if (frame % 100 === 0){// determines the spawn rate of each enemy
        let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize; //positions randomly the enemy on any given row
        enemies.push(new Enemy(verticalPosition)); //adds a new enemy
        enemyPositions.push(verticalPosition);
    }
}
//RESOURCES development here:
//UTILITIES development here:
function handleGameStatus(){ // small method to display the available resources on the top bar of the canvas
    ctx.fillStyle = 'gold';
    ctx.font = '30px Arial';
    ctx.fillText('Resources: ' + numberOfResources,20,55);
}
function animate(){ //function used to "re-draw" the element of the canvas making it seem "animated"
    ctx.clearRect(0,0, canvas.width,canvas.height); // method used to "clear up" the unnecessary stuff that constantly gets drawn
    ctx.fillStyle = 'purple';
    ctx.fillRect(0,0,controlsBar.width,controlsBar.height);
    handleGameGrid();
    handleDefenders();
    handleEnemies();
    handleGameStatus();
    ctx.fillText('Resources: ' + numberOfResources,20,55);
    frame++;
    requestAnimationFrame(animate); // method used to create an animation "loop" effect using recursion : )
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