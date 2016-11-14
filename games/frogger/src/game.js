var sprites = {
  frog: { sx: 0, sy: 0, w: 48, h: 48, frames: 3 },
  bg: { sx: 432, sy: 0, w: 320, h: 480, frames: 1 },
  car1: { sx: 143, sy: 0, w: 48, h: 48, frames: 1 },
  car2: { sx: 191, sy: 0, w: 48, h: 48, frames: 1 },  
  car3: { sx: 239, sy: 0, w: 96, h: 48, frames: 1 },
  car4: { sx: 335, sy: 0, w: 48, h: 48, frames: 1 },
  car5: { sx: 383, sy: 0, w: 48, h: 48, frames: 1 },
  trunk: { sx: 288, sy: 383, w: 142, h: 48, frames: 1 },
  death: { sx: 0, sy: 143, w: 48, h: 48, frames: 4 },
  win: { sx: 144, sy: 288, w: 48, h: 48, frames: 2},
  bug: { sx: 96, sy: 288, w: 48, h: 48, frames: 1},
  snake: { sx: 0, sy: 384, w: 97, h: 48, frames: 3},
  ten: { sx: 2, sy: 288, w: 48, h: 48, frames: 1},
  lifes: { sx: 0, sy: 96, w: 48, h: 48, frames: 1},
  show: { sx: 432, sy: 240, w: 320, h: 48, frames: 1}
};

var NF = 480 / 48;
var NC = 320 / 32;
var gameTime = 20;
var points = 0;
var lifes = 3;

var cars = {
  car1: {},
  car2: { dir: 1, row: 2, speed: 40, skin:'car2'},
  car3: { dir: -1, row: 3, speed: 30, skin:'car3'},
  car4: { dir: -1, row: 4, speed: 50, skin:'car4'},
  car5: { dir: 1, row: 2, speed: 40, skin:'car5'}
};

var OBJECT_PLAYER = 1,
    OBJECT_ENEMY = 4;

var startGame = function() {
  Game.setBoard(1,new TitleScreen("Frogger", 
                                  "Press space to start playing", points,
                                  playGame));
};

var playGame = function() {
  var board = new GameBoard();
  var play = new GameBoard();
  board.add(new backGround());
  var sl = new showLifes();
  play.add(sl);
  sl.initLifes();
  play.add(new Log({speed: 50}));
  play.add(new Log({dir: -1, row: 2, speed: 60}));
  play.add(new Log({row: 3}));
  play.add(new Spawner(new Bug(5),80));
  play.add(new Spawner(new Snake(),60));
  play.add(new Spawner(new Log({speed: 50}), 30));
  play.add(new Spawner(new Log({dir: -1, row: 2, speed: 60}), 30));
  play.add(new Spawner(new Log({row: 3}), 60));
  play.add(new Water());
  play.add(new Home());
  play.add(new Frog());
  play.add(new Car('car1'));
  play.add(new Car('car2', cars['car2']));
  play.add(new Car('car3',cars['car3']));
  play.add(new Car('car4',cars['car4']));
  play.add(new Spawner(new Car('car1'), 30));
  play.add(new Spawner(new Car('car2', cars['car2']), 30));
  play.add(new Spawner(new Car('car3',cars['car3']), 60));
  play.add(new Spawner(new Car('car4',cars['car4']), 30));
  //board.add(new Level(level1,winGame));
  Game.setBoard(1,play);
  Game.setBoard(0,board);
  //Game.setBoard(5,new GamePoints(0));
};

var Life = function(i){
  this.setup('lifes');

  this.i = i;
  this.y = 480;
  this.x = 0+40*this.i;

  this.step = function(){
    if(this.i >= lifes){
      this.board.remove(this);
    }
  }
}

Life.prototype = new Sprite();

var showLifes = function(){
  this.setup('show', {x: 0, y: 480});

  this.step = function(){}

  this.initLifes = function(){
    for(var i = 0; i < lifes; i++){
      this.board.add(new Life(i));
    }
  };
}

showLifes.prototype = new Sprite();

var showPoints = function(which, x, y){
  this.setup(which);

  this.y = y;
  this.x = x;

  this.count = 0;
  this.maxY = 30;

  this.time = 0;

  this.step = function(dt){
    if(this.time > 1){
      this.y--;
      this.count++;
    }

    this.time+=dt*8;

    if(this.maxY == this.count){
      this.board.remove(this);
    }
  }
}

showPoints.prototype = new Sprite();

var Snake = function(){
  this.setup('snake', {frame: 0});
  this.y = 4*48;
  this.x = Game.width;

  this.vx = (Math.random()*30)+5;
  this.count = 1;

  this.time = 0;

  this.step = function(dt){
    if(this.time > 1){
      if(this.frame == 0) this.count=1;
      if(this.frame == 2) this.count=-1;
      this.frame += this.count;
      this.time = 0;
      this.x-=this.vx;
    }

    this.time+=dt*8;

    var collision = this.board.collide(this,OBJECT_PLAYER);
    if(collision) {
      collision.hit();
    }

    if(this.x > Game.width || this.x < -this.w){
      this.board.remove(this);
    }
  }

  this.clone = function(){
    return new Snake();
  }
}

Snake.prototype = new Sprite();

var Bug = function(maxTime){
  this.setup('bug');
  this.x = Math.random()*(Game.width-32);
  this.y = Math.floor(Math.random()*10)*48;

  this.time = 0;
  this.maxTime = maxTime;

  this.step = function(dt){
    this.time+=dt;

    var collision = this.board.collide(this,OBJECT_PLAYER);
    if(collision) {
      points += 100;
      this.board.add(new showPoints('ten', this.x, this.y));
      this.board.remove(this);
    }
    if(this.time >= this.maxTime){
      this.board.remove(this);
    }
  }

  this.clone = function(){
    return new Bug(this.maxTime);
  }
}

Bug.prototype = new Sprite();

var winFrog = function(x, y){
  this.setup('win',{ frame: 0 });
  this.x = x;
  this.y = y;

  this.time = 0;
  this.count = 0;

  this.step = function(dt){
    if(this.time > 1){
      (this.frame == 0) ? this.frame++ : this.frame--;
      this.time = 0;
      this.count++;
    } else this.time+=dt*4;

    if(this.count == 6){
      this.board.remove(this);
    }
  }
}

winFrog.prototype = new Sprite();

var Death = function(centerX, centerY) {
  this.setup('death', { frame: 4 });
  this.x = centerX - this.w/2;
  this.y = centerY - this.h/2;
  this.time = 0;
}

Death.prototype = new Sprite();
Death.prototype.step = function(dt) {
  if(this.time > 1){
    this.frame--;
    if(this.frame < 0) {
      this.board.remove(this);
      if(lifes == 0) loseGame();
      else{
        lifes--;
        this.board.add(new Frog(gameTime));
      }
    }
    this.time = 0;
  } else this.time+=dt*8;
};

var Home = function() {
  this.x = 0;
  this.y = 0;

  this.h = 48;
  this.w = Game.width;

  this.step = function(){
    var collision = this.board.collide(this,OBJECT_PLAYER);
    if(collision) {
      this.board.remove(collision);
      this.board.add(new winFrog(collision.x, collision.y));
      this.board.add(new Frog(gameTime));
    }
  }
  this.draw = function(){}
}

Home.prototype = new Sprite();

var Water = function() {
  this.x = 0;
  this.y = 48;

  this.h = 48*3;

  this.step = function(){
    var collision = this.board.collide(this,OBJECT_PLAYER);
    if(collision && !collision.isOnLog()) {
      collision.hit(this);
    }
  }
  this.draw = function(){}
}

Water.prototype = new Sprite();

var Log = function(props) {
  this.merge(this.baseParameters);
  this.setup('trunk');
  this.merge(props);

  if (this.dir == -1) {this.x = Game.width}
  else this.x = -this.w;
  this.y = (this.row)*48; 

  this.step = function(dt){
    if (this.dir == 1){
      this.x += this.speed * dt;  
    }
    else this.x -= this.speed * dt;

    var collision = this.board.collide(this,OBJECT_PLAYER);
    if(collision) {
      collision.onLog(this);
    }
  
    if(this.x > Game.width || this.x < -this.w){
      this.board.remove(this);
    }
  }

  this.clone = function(){
    return new Log(props);
  }
}

Log.prototype = new Sprite();
Log.prototype.baseParameters = { dir: 1, row: 1, speed: 40}

var Car = function(skin, props) {
  this.merge(this.baseParameters);
  this.setup(skin);
  this.merge(props);

  if (this.dir == -1) {this.x = Game.width}
  else this.x = -48;
  this.y = (NF-1-this.row)*48;

  this.time = 0;

  this.step = function(dt) { 
  
    if (this.dir == 1){
      this.x += this.speed * dt;  
    }
    else this.x -= this.speed * dt;
    


    var collision = this.board.collide(this,OBJECT_PLAYER);
    if(collision) {
      collision.hit();
    }
  }

  this.clone = function(){
    return new Car(skin, props);
  }

}

Car.prototype = new Sprite();
Car.prototype.type = OBJECT_ENEMY;
Car.prototype.baseParameters = { dir: -1, row: 1, speed: 60, skin:'car1'};

var Spawner = function(obj, frec){
  this.x = 0;
  this.y = 0;
  this.time = 0;
  this.obj = obj;
  this.f = frec;

  this.draw = function(){}
}

Spawner.prototype = new Sprite();
Spawner.prototype.step = function(dt){
  if(this.time > this.f){
    this.o = this.obj.clone();
    if(this.o.sprite == 'bug') this.board.add(this.o);
    else this.board.addFirst(this.o);
    this.time = 0;
  } else this.time += dt*8;
}

var Frog = function() {
  this.setup('frog',{ frame: 0 });
  this.x = (((NC/2)-1)*32)+16;
  this.y = (NF*48)-48;

  this.vx = 0;
  this.dir = 1;

  this.time = 0;
  this.bigTime = 0;
  this.numShow = 0;

  this.maxRow = 0;
  this.realRow = 0;

  this.step = function(dt) { 
    if(this.time > 1){
      if(Game.keys['left']) {
        if (this.x > 32){
            this.x -= 32;
        }else{
            this.x = 0
        }
        this.time = 0;
      } else if(Game.keys['right']) {
        if (this.x+32 < Game.width-48){
          this.x += 32;
        }else{
          this.x = Game.width-48;
        }
        this.time = 0;
      }else if(Game.keys['up']) {
        if (this.y > 0){
          this.y -= 48;
          this.realRow++;
          if(this.realRow > this.maxRow){
            this.maxRow++;
            points+=10;
            if(this.maxRow == NF-1) points+=100;
          }
        }
        this.time = 0;
      }else if(Game.keys['down']) {
        if (this.y < (NF-1)*48){
          this.y += 48;
          this.realRow--;
        } 
        this.time = 0;
      }
    }
    this.time+=dt*7;
    this.bigTime+=dt;
    if(this.numShow == Math.floor(this.bigTime)){
      console.clear();
      console.log("You have " + gameTime + " seconds to clear the level.");
      console.log(this.numShow);
      this.numShow++;
    }
    if (this.x < (NC-1)*32 && this.x >= 0){this.x+=this.vx*dt*this.dir;}
    this.vx = 0;
    this.onTime();
  }

}

Frog.prototype = new Sprite();
Frog.prototype.type = OBJECT_PLAYER;
Frog.prototype.onLog = function(vLog){
  this.vx = vLog.speed;
  this.dir = vLog.dir;
}
Frog.prototype.isOnLog = function(){
  if(this.vx) return true;
  return false;
}
Frog.prototype.hit = function(damage){
  this.board.remove(this);
  this.board.add(new Death(this.x + this.w/2, 
                                 this.y + this.h/2));
}
Frog.prototype.onTime = function(){
  if(this.bigTime >= this.timeLimit) this.hit();
}

var backGround = function() {
  this.setup('bg', {x: 0, y:0});

  this.step = function(dt) {

  };
}

backGround.prototype = new Sprite();

var winGame = function() {
  Game.setBoard(1,new TitleScreen("You win!", 
                                  "Press space to play again", points,
                                  playGame));
};

var loseGame = function() {
  Game.setBoard(1,new TitleScreen("You lose!", 
                                  "Press space to play again", points,
                                  playGame));
  points = 0;
  lifes = 3;
};

window.addEventListener("load", function() {
  Game.initialize("game",sprites,startGame);
});
