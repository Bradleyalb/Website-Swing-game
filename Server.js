// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);
var canvasHeight = 650;
var canvasWidth = 1500;
var color = getRandomColor();
width = 50;
height = 10;
radius = 70;
ballRadius = 10;
app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));
// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});
// Starts the server.
server.listen(5000, function() {
  console.log('Starting server on port 5000');
});
// Add the WebSocket handlers

var players = {};
var bullets = {};
io.on('connection', function(socket) {
  socket.on('new player', function() {
    color = getRandomColor();
    players[socket.id] = {
      x: getRandomInt(1600),
      y: 30,
      speedY: 0,
      speedX: 0,
      speedS: 0,
      speed: 0,
      degrees: 0,
      firstRight: true,
      active: true,
      rope: false,
      rightS: true,
      reset: false,
      score: 0,
      Xcenter: 0,
      Ycenter: 0,
      color: color,
      name: "",
    };
  });
  socket.on('new bullet', function() {
    bullets[socket.id] = {
      x: 0,
      y: 0,
      dir: 0,
      color: color,
      active: false,
      speed: 8,
    };
  });
  socket.on('name', function(string) {
    players[socket.id].name = string;
  });
  socket.on('hit', function(players){
    var player = players[socket.id] || {};
    if (player.reset == true){
      reset(player);
    }
  });
  socket.on('movement', function(data) {
    var swinger = players[socket.id] || {};
    swing(swinger, data.left, data.right, data.jump);
    var bullet = bullets[socket.id] || {};
    drawbullet(bullet, swinger, data.up, data.down);
    for (var id in players) {
      var player = players[id];
      for (var bul in bullets){
        if (hit(player, bullets[bul])&&(bul != id)){
            players[bul].score++;
            player.score--;
            reset(player);
        }
      }
    }
  });
   socket.on('disconnect', function() {
    players[socket.id] = 0;
    bullets[socket.id] = 0;
  });
});
setInterval(function() {
  io.sockets.emit('state', players);
  io.sockets.emit('bul', bullets);
}, 1000 / 60);


function getRandomInt(max) {
  		return Math.floor(Math.random() * max);
}
function swing(swinger, aPressed, dPressed, ePressed){     
        swinger.rope = false;    
        if (swinger.y > canvasHeight - ballRadius && swinger.speedY > 0)
        {
            swinger.speedY = 0;
            swinger.y = canvasHeight - ballRadius;
        }
        if (swinger.y < ballRadius){
            swinger.speedY = 1;
            swinger.y = ballRadius;
        }
        if (swinger.x > canvasWidth -ballRadius){
            swinger.speedX = 0;
            swinger.x = canvasWidth - ballRadius;
        }
        if (swinger.x < ballRadius){
            swinger.speedX = 0;
            swinger.x = ballRadius;
        }
        if (!aPressed && !dPressed || (aPressed && dPressed))
        {
            swinger.firstRight = true;
            swinger.degrees = 0;
            swinger.y+=swinger.speedY;
            swinger.speedY+=0.3;
            swinger.x+=swinger.speedX;
            swinger.rope = false;  
        }
        if (dPressed && !aPressed && swinger.y < canvasHeight - ballRadius)
        {
            swingRight(swinger);
            swinger.rope = true;
        }
        if ((swinger.y >= canvasHeight - 10) && ePressed)
        {
            jumping(swinger);
        }    
        if (aPressed && !dPressed && swinger.y < canvasHeight - ballRadius)
        {
            swingLeft(swinger);
            swinger.rope = true;
        }
    }
    function swingRight(swinger){ //Swing to the right in an arc when the right button is pushed
            if (swinger.firstRight)
            {
                swinger.Xcenter = swinger.x + radius;
                swinger.Ycenter = swinger.y;
                swinger.speed = swinger.speedY/45;
                swinger.firstRight=false;
                swinger.rightS = true;
            }
            swinger.x = swinger.Xcenter - Math.floor(radius*Math.cos(swinger.degrees));
            swinger.y = swinger.Ycenter - Math.floor(radius*Math.sin(swinger.degrees));
            if (swinger.speed<0.25){
              swinger.speed = 0.25;
            }
            swinger.speedS = Math.abs(swinger.speed) - Math.abs(swinger.Ycenter + radius - swinger.y)/500;
            if (isZero(swinger))
            {
                swinger.rightS=!swinger.rightS/1.2;
                swinger.speedS = 0.25;
            } 
            if (swinger.rightS){
                swinger.degrees-=swinger.speedS/1.2;
                swinger.speedX = -swinger.speedS*(swinger.Ycenter-swinger.y);  
                swinger.speedY = (swinger.speedS*2*(swinger.Xcenter-swinger.x));
            }
            else{
                swinger.degrees+=swinger.speedS;
                swinger.speedX = swinger.speedS*(swinger.Ycenter-swinger.y);  
                swinger.speedY = -(swinger.speedS*2*(swinger.Xcenter-swinger.x));
            }
            swinger.speedY = Math.max(-15,swinger.speedY);
            swinger.speedX = -swinger.speedS*(swinger.Ycenter-swinger.y);
        }
    function  swingLeft(swinger){ //Swings to the left when the "left" key is Pressed
    if (swinger.firstRight)
    {
        swinger.Xcenter = swinger.x - radius;
        swinger.degrees = Math.PI;
        swinger.Ycenter = swinger.y;
        swinger.speed = swinger.speedY/45;
        swinger.firstRight = false;
        swinger.rightS = false;
    }
    swinger.x = swinger.Xcenter - radius*Math.cos(swinger.degrees);
    swinger.y = swinger.Ycenter - radius*Math.sin(swinger.degrees);
    if (swinger.speed<0.25){
              swinger.speed = 0.25;
    }
    swinger.speedS = Math.abs(swinger.speed) - Math.abs(swinger.Ycenter + radius - swinger.y)/500;
    if (isZero(swinger))
    {
        swinger.rightS=!swinger.rightS;
        swinger.speedS = 0.25;
    } 
    if (swinger.rightS){
        swinger.degrees-=swinger.speedS/1.2;
        swinger.speedX = -swinger.speedS*(swinger.Ycenter-swinger.y);  
        swinger.speedY = (swinger.speedS*2*(swinger.Xcenter-swinger.x));
    }
    else{
        swinger.degrees+=swinger.speedS/1.2;
        swinger.speedX = swinger.speedS*(swinger.Ycenter-swinger.y);  
        swinger.speedY = -(swinger.speedS*2*(swinger.Xcenter-swinger.x));
    }
    swinger.speedY = Math.max(-15,swinger.speedY);
       
}
    function  jumping(swinger){ //When the player is on the ground they can press "e" key to jump up 
    swinger.speedX = 0;
    swinger.speedY = 0;
    swinger.speedY = -10;
}

function  reset(swinger){
    swinger.x = getRandomInt(canvasWidth);
    swinger.y = 50;
    swinger.speedY = 0;
    swinger.speedX = 0;
}

function isZero(swinger) //function to check if the swinger needs to change direction
        {
            if (Math.abs(swinger.speedS) < 0.01)
            {
                return true;
            }    
            else
            {
                return false;
            }
        }

        function sign(deltaX)
        {
          if (deltaX > 0){
            return 1;
          }
          if (deltaX < 0){
            return -1;
          }
        }
function drawbullet(bullet, swinger, up, down){
        if(bullet.y<0||bullet.y>canvasHeight){
          bullet.active = false;
        }
        if (!bullet.active){
          if(up == true){
            bullet.active = true;
            bullet.up = true;
            setLocation(bullet, swinger);
          }
          if(down == true){
            bullet.active = true;
            bullet.up = false;
            setLocation(bullet, swinger);
          }
        }
        if(bullet.active){
          if(bullet.up == true){
          bullet.y-=bullet.speed;
          }
          if(bullet.up == false){
            bullet.y+=bullet.speed;
          }
        }
      }
      function setLocation(bullet,swinger){
        bullet.x = swinger.x-25;
        bullet.y = swinger.y;
      }
      function  hit(swinger, bul){
          if (swinger.x+ballRadius>bul.x && swinger.x-ballRadius<bul.x+width && swinger.y+ballRadius > bul.y && swinger.y-ballRadius < bul.y+height && bul.active){
              return true;
          }
          else{
              return false;
          }
      }
function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}