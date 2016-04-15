window.addEventListener("load",function() {
	var Q = Quintus({ development: true, audioSupported: ["mp3", "ogg"] });
	Q.include("Scenes, TMX, Sprites, 2D, Anim, UI, Touch, Input, Audio").setup({maximize: false, width: 320, height:  480});
	Q.controls();
	Q.touch();
	Q.enableSound();

	var gameOver = false;
	
	Q.animations("mario", {
		stand_right: {frames: [0], rate: 1/5},
		stand_left: {frames: [14], rate: 1/5},
		run_right: {frames: [1,2,3], rate: 1/5},
		run_left: {frames: [15,16,17], rate: 1/5},
		jump_right: {frames: [4], rate: 1/5},
		jump_left: {frames: [18], rate: 1/5},
		die_right: {frames: [12], loop: false, rate: 6, trigger: "died"},
		die_left: {frames: [26], loop: false, rate: 6, trigger: "died"}
	});

	Q.animations("goomba_s", {
		stand: {frames: [0], rate: 1/3},
		move: {frames: [0,1], rate: 1/3},
		kill: {frames: [2], loop: false, rate: 1/2, trigger: "killed"}
	});

	Q.animations("bloopa_s", {
		release:{frames: [0], rate: 1/3},
		charge: {frames: [1], rate: 1/3},
		kill: {frames: [2], loop: false, rate: 1/2, trigger: "killed"}
	});

	Q.animations("coin_s", {
		glow: {frames: [0,1,2], rate: 1/6}
	});

	Q.Sprite.extend("Icon", {
		init: function(p){
			this._super(p, {sheet: "mario_small", x: Q.width/2-20, y: Q.height/2 + 10});
		}
	});

	Q.Sprite.extend("Mario", {
		init: function(p){

			this._super(p, {sprite: "mario",sheet: "mario_small", 
				x: 150,y: 380, dir: "right", time: 0,
				vy_aux: 0, inAir: false});
			this.add('2d, platformerControls, animation');

			this.on("hit.sprite",function(collision) {
      			if(collision.obj.isA("Princess")) {
      				Q.audio.stop();
      				Q.audio.play("music_level_complete.mp3");
        			Q.stageScene("endGame",1, { label: "You Won!" });
        			this.destroy();
        			collision.obj.destroy();
      			} else if (collision.obj.isA("Coin")){
      				Q.audio.play("coin.mp3");
					collision.obj.chain({y: collision.obj.p.y-20}, 0.05, Q.Easing.Quadratic.Out, {callback: function(){this.destroy();Q.state.inc("score",1);}});
		
      			}
    		});

    		this.on("died", this, "restart");
		},

		restart: function(){
			this.destroy();
			Q.clearStages();
			if(Q.state.get("lives") < 0) Q.stageScene("gameEnded",1);
			else Q.stageScene("lives",1);
		},

		dying: function(){
			this.del('2d, platformerControls');
			Q.state.dec("lives", 1);
	    	Q.state.set("score", 0);
			this.play("die_" + this.p.dir, 1);
			gameOver = true;
			this.p.vy = -5;
		},

		step: function(dt){
			if(gameOver){
				this.p.time+=dt;
				if(this.p.time >= 0.5){
					this.p.vy += 9.4*dt;
					this.p.y+=this.p.vy;
				}
			}else{
				if(this.p.y > Q.height+110){
					Q.audio.stop();
	    			Q.audio.play("music_die.mp3");
	        		this.dying();
				}

				if(this.p.vy_aux != this.p.vy){
					this.p.inAir = true;
				}else{
					this.p.inAir = false;
				}

				this.p.vy_aux = this.p.vy;

				if(!this.p.inAir) this.p.dir = this.p.direction;

				if(this.p.inAir){
					this.play("jump_" + this.p.dir);
				}else if(this.p.vx > 0){
					this.play("run_right");
				}else if(this.p.vx < 0){
					this.play("run_left");
				}else{
					this.play("stand_" + this.p.dir);
				}
			}
		}
	});

	Q.component("defaultEnemy", {
		added: function(){
			this.entity.on("bump.top",function(collision) {
	      		if(collision.obj.isA("Mario")) { 
	      			this.play("kill", 1);
	      			this.p.vx = 0;
	        		collision.obj.p.vy = -300;
	      		}
	    	});

	    	this.entity.on("bump.left,bump.right,bump.bottom",function(collision) {
	    		if(collision.obj.isA("Mario")) { 
	    			Q.audio.stop();
	    			Q.audio.play("music_die.mp3");
	        		collision.obj.dying();
	      		}
	    	});

	    	this.entity.on("killed", this.entity, "destroy");
		}
	});

	Q.Sprite.extend("Goomba",{
		init: function(p) {
			this._super(p, { sprite: 'goomba_s', sheet: 'goomba',
				vx: 90});
    		this.add('2d, aiBounce, animation, defaultEnemy');
    	},

  		step:function(dt){
  			if(!gameOver){
  				this.play("move");
  			} 
  			else{
  				this.play("stand");
  				this.del('2d');
  			} 
  		}
	});

	Q.Sprite.extend("Bloopa",{
		init: function(p) {
			this._super(p, { sprite: 'bloopa_s', sheet: 'bloopa',
				vy: -300});
    		this.add('2d, animation, defaultEnemy');

	    	this.on("step", function(dt) {
	    		if(!gameOver){
	    			this.play("release");

	    			if (this.p.vy>=150){
	    				this.play("charge");
	    			} 

			    	if(this.p.vy == 0) this.p.vy = -450;
			    }else{
			    	this.del('2d');
			    }
	    	});
  		}
	});

	Q.Sprite.extend("Coin",{
		init: function(p){
			this._super(p, { sprite: 'coin_s', sheet: 'coin',
				time: 0, gravity: 0, sensor: true});
    		this.add('2d, animation, tween');
		},

		step: function(dt){
			this.play("glow");
		}
	});

	Q.Sprite.extend("Princess", {
	 	init: function(p) {
	    	this._super(p, { sheet: 'princess' });
	  	}
	});

	Q.Sprite.extend("MainTitle", {
	 	init: function(p) {
	    	this._super(p, { sheet: 'mainTitle' });
	  	}
	});

	Q.UI.Text.extend("Score",{
		init: function(p){
			this._super({
				label: "Score: 0",
				x: 20,
				y: 0
			});

			Q.state.on("change.score", this, "score");
		},

		score: function(score){
			this.p.label = "Score: " + score;
		}
	});

	Q.scene('hud',function(stage){
		var box = stage.insert(new Q.UI.Container({
	    	x: 60, y: 25, fill: "rgba(0,0,0,0)"
	  	}));

	  	var label = box.insert(new Q.Score());

	  	box.fit(10);
	});

	Q.scene('lives',function(stage){
		var box = stage.insert(new Q.UI.Container({
	    	x: Q.width/2, y: Q.height/2, fill: "rgba(1,1,1,0)"
	  	}));

		var icon = stage.insert(new Q.Icon());

	  	var label = box.insert(new Q.UI.Text({x:20, y: -10, color: "white",
	  								label: "x "+Q.state.get("lives")}));

	  	var time = 0;

	  	stage.on("step", function(dt){
	  		time += dt;
	  		if(time >= 1.5){
	  			Q.clearStages();
	  			gameOver = false;
	    		Q.stageScene('level1');
	    		Q.stageScene('hud',1);
	  		}
	  	})

	  	box.fit(10);
	});

	Q.scene('endGame',function(stage) {
		var box = stage.insert(new Q.UI.Container({
	    	x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
	  	}));
	  
	  	var button = box.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#CCCCCC",
	                                           label: "Play Again" }));         
	  	var label = box.insert(new Q.UI.Text({x:10, y: -10 - button.p.h, 
	                                        label: stage.options.label }));
	  	button.on("click",function() {
	  		Q.audio.stop();
	    	Q.clearStages();
	    	gameOver = false;
	    	Q.stageScene('startGame');
	  	});
	  	box.fit(20);
	});

	Q.scene('gameEnded',function(stage) {

		var box = stage.insert(new Q.UI.Container({
	    	x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0)"
	  	}));
	  
		var button = box.insert(new Q.UI.Button({ x: 0, y: 0, h:480, w:320, fill: "rgba(0,0,0,0)"}));         

	  	var label = box.insert(new Q.UI.Text({x:0, y: 0, color: "white",
	  								label: "GAME OVER"}));    
	  	
	  	button.on("click",function() {
	    	Q.clearStages();
	    	Q.state.reset({score: 0, lives: 3});
	    	Q.clearStages();
	    	Q.stageScene("startGame",2);
	  	});

	  	stage.on("step",function() {
	    	if(Q.inputs['fire']){
		    	Q.clearStages();
		    	Q.state.reset({score: 0, lives: 3});
		    	Q.clearStages();
		    	Q.stageScene("startGame",2);
		    }
	  	});
	  	box.fit(1000);
	});


	Q.scene('startGame',function(stage) {

		stage.insert(new Q.MainTitle({x:160, y: 240}));

		var box = stage.insert(new Q.UI.Container({
	    	x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0)"
	  	}));
	  
		var button = box.insert(new Q.UI.Button({ x: 0, y: 0, h:480, w:320, fill: "rgba(0,0,0,0)"}));         
	  	
		var time = 0;

	  	button.on("click",function() {
	    	Q.clearStages();
	    	Q.state.reset({score: 0, lives: 3});
	    	Q.stageScene('lives',1);
	  	});

	  	button.on("step",function(dt) {
	  		time+=dt;
	  		if(time >= 1){
		    	if(Q.inputs['fire']){
			    	Q.clearStages();
			    	Q.state.reset({score: 0, lives: 3});
			    	Q.stageScene('lives',1);
			    }
			}
	  	});
	  	box.fit(1000);
	});

	Q.scene("level1", function(stage){
		Q.stageTMX("level.tmx",stage);

		stage.insert(new Q.Coin({x: 400, y: 500}));
		stage.insert(new Q.Coin({x: 430, y: 500}));
		stage.insert(new Q.Coin({x: 460, y: 500}));
		stage.insert(new Q.Coin({x: 1400, y: 420}));
		stage.insert(new Q.Coin({x: 1430, y: 420}));
		stage.insert(new Q.Coin({x: 1600, y: 420}));
		
		stage.insert(new Q.Bloopa({x: 300, y: 420}));

		stage.insert(new Q.Goomba({x: 500, y: 420}));
		stage.insert(new Q.Goomba({x: 1550, y: 420}));
		stage.insert(new Q.Goomba({x: 1500, y: 420}));

		stage.insert(new Q.Princess({x: 1900, y: 452}));

		var player = stage.insert(new Q.Mario());
		stage.add("viewport").follow(player,{x:true, y:false});
		stage.centerOn(160,370);

		Q.audio.play("music_main.mp3", {loop: true});
	});

	Q.load("coin.mp3, music_level_complete.mp3,music_main.mp3, music_die.mp3, mario_small.png, mario_small.json, goomba.png, goomba.json, bloopa.png, bloopa.json, princess.png, mainTitle.png, coin.png, coin.json", function() {
	 	Q.sheet("mainTitle","mainTitle.png", { tilew: 320, tileh: 480 });
	 	Q.sheet("mario_small","mario_small.png", { tilew: 32, tileh: 32 });
	 	Q.sheet("goomba","goomba.png", { tilew: 28, tileh: 28 });
	 	Q.sheet("bloopa","bloopa.png", { tilew: 28, tileh: 32 });
	 	Q.sheet("princess","princess.png", { tilew: 30, tileh: 48 });
		Q.sheet("coin","coin.png", { tilew: 34, tileh: 34 });
		Q.compileSheets("mario_small.png","mario_small.json");
		Q.compileSheets("coin.png","coin.json");
		Q.compileSheets("goomba.png","goomba.json");
		Q.compileSheets("bloopa.png","bloopa.json");
		Q.stageScene("startGame",2);
	});

	Q.loadTMX("level.tmx", function(){
		
	});
});
