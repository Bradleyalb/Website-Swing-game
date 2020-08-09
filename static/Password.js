var socket = io();
var width = 50;
var height = 10;
var ballRadius = 10;
var max = 0;
var leaderboard = [];
var string = prompt("Please enter your name", "Name");
var password = prompt("Please enter the Password");
console.log(string);
var name = {
  username: string
}
var movement = {
  up: false,
  down: false,
  left: false,
  right: false,
  jump: false
}
var gotHit = {
  id: 0,
  hit: false
}

document.addEventListener('keydown', function(event) {
  switch (event.keyCode) {
    case 65: // A
      movement.left = true;
      break;
    case 87: // W
      movement.up = true;
      break;
    case 68: // D
      movement.right = true;
      break;
    case 69:
      movement.jump = true;
      break;
    case 83: // S
      movement.down = true;
      break;
  }
});

document.addEventListener('keyup', function(event) {
  switch (event.keyCode) {
    case 65: // A
      movement.left = false;
      break;
    case 87: // W
      movement.up = false;
      break;
    case 68: // D
      movement.right = false;
      break;
    case 69:
      movement.jump = false;
      break;
    case 83: // S
      movement.down = false;
      break;
  }
});
if (password == "7532"){
socket.emit('new player');
socket.emit('name', string);
socket.emit('new bullet');
setInterval(function() {
  socket.emit('movement', movement);
}, 1000 / 60);
}
var players = {};
var bullets = {};
var canvas = document.getElementById('canvas');
canvas.width = 1500;
canvas.height = 650;
var context = canvas.getContext('2d');
socket.on('state', function(Tplayers) {
  //context.fillStyle = 'green';
  players = Tplayers;
});

socket.on('bul', function(Tbullets) {
    bullets = Tbullets;
    draw();
    socket.emit('hit',players);
    });

function draw(){
  context.clearRect(0, 0, 1500, 650);
  //var img = document.getElementById("space");
  //ctx.drawImage(img, 0, 0);
  for (var id in bullets){
      var bullet = bullets[id];
      if (bullet.active == true){
        context.beginPath();
        context.rect(bullet.x,bullet.y, width, height);
        context.fillStyle = bullet.color;
        context.fill();
      }
      }
  for (var id in players) {
    var player = players[id];
    leaderboard.push(players[id].score);
    context.beginPath();
    context.fillStyle = player.color;
    context.arc(player.x, player.y, 10, 0, 2 * Math.PI);
    if (player.rope == true){
      context.moveTo(player.x,player.y);
      context.lineTo(player.Xcenter, player.Ycenter);
      context.stroke();
    }
    context.fill();
    context.font = "30px Arial";
    context.fillText(player.name + ": " + player.score, player.x+10, player.y-10);
  }
}



// 