const canvas = document.getElementById('canvas1'); //element used to connect the html canvas to a javascript version of the canvas
const ctx = canvas.getContext('2d'); //element used to use the 2d available methods of the canvas

//JSON Server port to open the json file
//json-server --watch C:\Users\cioff\OneDrive\Desktop\BassBarricade\leaderboard.json --port 3000

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
const floatingMessages = []; //array used to store all the floating messages
const enemyTypes = []; //array used to store all the different type of enemies
const winningScore = 10000; //winning score used to let the game finish whenever the player gets to that value
const startButton = document.getElementById('startButton');//constant for temporary start button
const startScreen = document.getElementById('startScreen');//constant for temporary start screen
const retryButton = document.getElementById('retryButton');//constant for the reset button
const submitButton = document.getElementById('submit-button');//temporary submit button for the name and score

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
//definition of the bullet sprite
const bullet1 = new Image();
bullet1.src = 'sprites&assets/bullet.png';
class Projectile{
    constructor(x,y) {
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 10;
        this.power = 20; //determines the power of the projectile, so how much damage it inflicts
        this.speed = 6; //speed at which the projectile runs
    }
    update(){
        this.x += this.speed;
    }
    draw(){ //FOR NOW it draws a small circle for the projectile
        //ctx.fillStyle = 'black'; //old small ball
        //ctx.beginPath();
        //ctx.arc(this.x, this.y, this.width,0,Math.PI * 2);
        //ctx.fill();
        ctx.drawImage(bullet1, this.x, this.y,76,45);
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
//defender sprites and animations
const defender1 = new Image();
defender1.src = 'sprites&assets/plant.png';

//defender movement and logic
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
        this.frameX = 0;
        this.frameY = 0;
        this.spriteWidth = 167;
        this.spriteHeight = 243;
        this.minFrame = 0;
        this.maxFrame = 1;
    }
    draw(){ // draw method to actually draw the defender : )
        //ctx.fillStyle = 'purple'; //this was the old hit-box representation
        //ctx.fillRect(this.x, this.y, this.width, this.height);

        //ctx.fillStyle = 'gold'; //health display portion
        //ctx.font = '30px Delicious Handrawn';
        //ctx.fillText(Math.floor(this.health),this.x + 25,this.y + 30);

        ctx.drawImage(defender1,this.frameX * this.spriteWidth, 0,
           this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
    }
    update(){ //method for the projectile shooting
        if(frame % 30 === 0){
            if (this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = this.minFrame;
        }
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
//FLOATING MESSAGES development here:
class floatingMessage{ //class for every floating message type inside the game
    constructor(value, x, y, size, color){
        this.value = value;
        this.x = x;
        this.y = y;
        this.size = size; //size of the text
        this.lifeSpan = 0; //determines for how much time the message should stay on screen
        this.color = color; //color of the text
        this.opacity = 1;
    }
    update(){ //used to make the message float up
        this.y -= 0.3;
        this.lifeSpan += 1;
        if (this.opacity > 0.01) this.opacity -= 0.01; // used to make the text fade away
    }
    draw(){
        ctx.globalAlpha = this.opacity; //sets everything that is in the canvas to 1 opacity
        ctx.fillStyle = this.color;
        ctx.font = this.size + 'px Delicious Handrawn'; //sets font
        ctx.fillText(this.value, this.x, this.y); //sets the text and position
        ctx.globalAlpha = 1; //this resets the opacity back to its original value of 1
    }
}
function handleFloatingMessages(){ //it will update and remove the messages on-screen
    for (let i = 0; i < floatingMessages.length; i++){
        floatingMessages[i].update();
        floatingMessages[i].draw();
        if (floatingMessages[i].lifeSpan >= 50){ //checks and deletes whichever messages have been on screen for their lifespan
            floatingMessages.splice(i, 1);
            i--;
        }
    }
}
//ENEMIES development here:
//ememy sprites and animations:
const enemySprites = [];
const enemy1 = new Image();
enemy1.src = 'sprites&assets/zombie.png';
enemySprites.push(enemy1);
//const enemy2 = new Image();
//enemy2.src = 'sprites&assets/enemy/Flying-Enemy/eye monster idle.png';
//enemyTypes.push(enemy2);

//enemy movement and logic:
class Enemy  {
    constructor(verticalPosition) {
        this.x = canvas.width;
        this.y = verticalPosition;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.speed = Math.random() * 0.1 + 0.4; // attributed speed that is randomly generated for the enemy
        this.movement = this.speed;
        this.health = 100;
        this.maxHealth = this.health;
        //attributes used for the animation of the enemy sprites
        this.enemyType = enemySprites[Math.floor(Math.random() * enemySprites.length)];
        this.frameX = 0;
        this.minFrame = 0;
        this.maxFrame = 7;
        this.spriteWidth = 292;
        this.spriteHeight = 410;
    }
    update(){ //updates the position of the enemy
        this.x -= this.movement;
        //animation part of the enemy sprites
        if (frame % 9 === 0){
            if (this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = this.minFrame;
        }
    }
    draw(){
        //ctx.fillStyle = 'red'; //these were used to display rectangles instead of the sprites
        //ctx.fillRect(this.x, this.y, this.width, this.height);

        //ctx.fillStyle = 'black'; //health display portion
        //ctx.font = '30px Delicious Handrawn';
        //ctx.fillText(Math.floor(this.health),this.x + 25,this.y + 30);

        // method used to draw and place images on the canvas, in this case used to draw and animate the sprites
        // s stands for Source and d stands for Destination
        //ctx.drawImage(img,sx,sy,sw,sh,dx,dy,dw,dh);
        ctx.drawImage(this.enemyType,this.frameX * this.spriteWidth,0,
            this.spriteWidth,this.spriteHeight,this.x,this.y,this.width,this.height);
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
            let gainedResources = Math.floor(enemies[i].maxHealth/10); // used to give back to the player resources according to the damage inflicted
            floatingMessages.push(new floatingMessage('+' + gainedResources,enemies[i].x,enemies[i].y + 40,30,'black'));
            floatingMessages.push(new floatingMessage('+' + gainedResources,160,50,30,'black'));
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
        if (enemiesInterval > 110) enemiesInterval -= 50; //shortens the flow-rate used mainly to control the games DIFFICULTY
    }
}
//RESOURCES development here:
const amounts = [20,30,40]; // value used for descending resources
const resource = new Image();
resource.src = 'sprites&assets/sun60.png';
class Resource{
    constructor() {
        this.x = Math.random() * (canvas.width - cellSize);
        this.y = (Math.floor(Math.random() * 5) + 1) * cellSize + 25;
        this.width = cellSize * 0.6;
        this.height = cellSize * 0.6;
        this.amount = amounts[Math.floor(Math.random() * amounts.length)]; // method to assign a value of the resource randomly from the array of possible
    }
    draw(){
        //ctx.fillStyle = 'yellow'; //old yellow rectangle
        //ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.drawImage(resource, this.x, this.y,60,60);
        ctx.fillStyle = 'black';
        ctx.font = '30px Delicious Handrawn';
        ctx.fillText(this.amount, this.x + 60, this.y);
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
            floatingMessages.push(new floatingMessage('+' + resources[i].amount,resources[i].x,resources[i].y,30,'black')); //messages to display the added resources
            floatingMessages.push(new floatingMessage('+' + resources[i].amount,160,50,30,'black'));
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
        ctx.fillText('GAME OVER', 220, 330);
        ctx.font = '30px Delicious Handrawn';
        ctx.fillText('You finished with ' + score + ' points', 324,380);
        // show the retry button
        retryButton.style.display = 'block';
    }
    if (score >= winningScore && enemies.length === 0){ //controls if the player has actually got the winning score
        ctx.fillStyle = 'black';
        ctx.font = '100px Delicious Handrawn';
        ctx.fillText('YOU WON!', 280,330);
        ctx.font = '30px Delicious Handrawn';
        ctx.fillText('You won with ' + score + 'points', 344,380);
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
    } else{ //this displays the warning message
        floatingMessages.push(new floatingMessage('need more resources',mouse.x,mouse.y,20,'black'));
    }
})

function animate(){ //function used to "re-draw" the element of the canvas making it seem "animated"
    ctx.clearRect(0,0, canvas.width,canvas.height); // method used to "clear up" the unnecessary stuff that constantly gets drawn
    ctx.fillStyle = 'mediumpurple';
    ctx.fillRect(0,0,controlsBar.width,controlsBar.height);
    handleGameGrid();
    handleDefenders();
    handleResources();
    handleProjectiles();
    handleEnemies();
    handleGameStatus();
    handleFloatingMessages();
    frame++;
    if (!gameOver) requestAnimationFrame(animate); // method used to create an animation "loop" effect using recursion : )
}
//animate(); old way to animate the game without the button
leaderboard();
//start and finish button functions
startButton.addEventListener('click', () => {
    animate();
    startScreen.style.display = 'none';
});
retryButton.addEventListener('click', () => {
    // restart the game by reloading the page
    location.reload();
    // hide the retry button again
    retryButton.style.display = 'none';
});
submitButton.addEventListener('click', addEntry);

window.addEventListener('resize', function(){ //method used to correctly handle the resize function of the web window
    canvasPosition = canvas.getBoundingClientRect();
})

function collision (first, second){//method used to make two objects collide
    if (    !( first.x > second.x + second.width || //horizontal collision check
                first.x + first.width < second.x ||
                first.y > second.y + second.height || //vertical collision check
                first.y + first.height < second.y)
    ) {
        return true;
    }
}

//function/method used to read the JSON file and print i on the leaderboard
function leaderboard(){
    fetch('https://my-json-server.typicode.com/cioffosplat/BassBarricade/entries')
        .then(response => response.json())
        .then(data => {
            const leaderboardElement = document.getElementById('leaderboard');
            const leaderboard = data.entries.sort((a, b) => b.score - a.score);

            leaderboard.forEach((entry, index) => {
                const place = index + 1;
                const leaderboardEntryElement = document.createElement('li');
                leaderboardEntryElement.classList.add('leaderboard-entry');

                const leaderboardEntryPlaceElement = document.createElement('span');
                leaderboardEntryPlaceElement.classList.add('leaderboard-entry-place');
                leaderboardEntryPlaceElement.textContent = place;

                const leaderboardEntryNameElement = document.createElement('span');
                leaderboardEntryNameElement.textContent = entry.name;

                const leaderboardEntryScoreElement = document.createElement('span');
                leaderboardEntryScoreElement.textContent = entry.score;

                leaderboardEntryElement.appendChild(leaderboardEntryPlaceElement);
                leaderboardEntryElement.appendChild(leaderboardEntryNameElement);
                leaderboardEntryElement.appendChild(leaderboardEntryScoreElement);
                leaderboardElement.appendChild(leaderboardEntryElement);
            });
        });
}

//add entry function to add the name and score to the leaderboard
function addEntry() {
    const name = document.getElementById('name').value;
    const score = parseInt(document.getElementById('score').value);

    const entry = {
        name: name,
        score: score
    };

    fetch('https://my-json-server.typicode.com/cioffosplat/BassBarricade/entries', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
    })
        .then(response => response.json())
        .then(data => {
            const leaderboard = document.getElementById('leaderboard');
            const leaderboardEntries = leaderboard.getElementsByTagName('li');
            const newEntry = document.createElement('li');
            newEntry.classList.add('leaderboard-entry');
            newEntry.innerHTML = `<span class="leaderboard-entry-place">${data.place}</span>
                              <span>${data.name}</span>
                              <span>${data.score}</span>`;

            // Insert the new entry into the leaderboard array and sort by score
            const leaderboardArray = Array.from(leaderboardEntries);
            leaderboardArray.push(newEntry);
            leaderboardArray.sort((a, b) => {
                const aScore = parseInt(a.getElementsByTagName('span')[2].textContent);
                const bScore = parseInt(b.getElementsByTagName('span')[2].textContent);
                return bScore - aScore;
            });

            // Update the leaderboard with the new array
            leaderboard.innerHTML = '';
            leaderboardArray.forEach(entry => leaderboard.appendChild(entry));

            // Show confirmation message
            alert(`Entry added: ${data.name} - ${data.score}`);
        })
        .catch(error => console.error(error));
}



