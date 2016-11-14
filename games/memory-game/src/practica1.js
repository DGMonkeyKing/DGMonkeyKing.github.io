/**
 * MemoryGame es la clase que representa nuestro juego. Contiene un array con la cartas del juego,
 * el número de cartas encontradas (para saber cuándo hemos terminado el juego) y un texto con el mensaje
 * que indica en qué estado se encuentra el juego
 */
var MemoryGame = MemoryGame || {};
var time = 0;


MemoryGame = function(gs) {

	var cards = [new MemoryGame.Card("rocket"), new MemoryGame.Card("8-ball"), new MemoryGame.Card("zeppelin"), new MemoryGame.Card("potato"),
				 new MemoryGame.Card("rocket"), new MemoryGame.Card("kronos"), new MemoryGame.Card("unicorn"), new MemoryGame.Card("guy"), 
				 new MemoryGame.Card("dinosaur"), new MemoryGame.Card("zeppelin"), new MemoryGame.Card("8-ball"), new MemoryGame.Card("unicorn"), 
				 new MemoryGame.Card("potato"), new MemoryGame.Card("guy"), new MemoryGame.Card("kronos"), new MemoryGame.Card("dinosaur")];

	var up = null;
	var action = "home";
	var solved = 0;
	var tout;
	var clicks = true;

	this.tic = function() {
		return new Date();
	}

	this.tac = function(t) {
		var trimSecondsMinutes = function(elapsed) {
			if (elapsed >= 60)
	        return TrimSecondsMinutes(elapsed - 60);
	    	return elapsed;
		}
		var time = new Date();
		var elapsed = time - t;
		var seconds = Math.round(elapsed / 1000);
		var minutes = Math.round(seconds / 60);

		var sec = trimSecondsMinutes(seconds);
		var min = trimSecondsMinutes(minutes);
		
		return ("0"+min+":"+sec); 
	}

	this.shuffle = function(){

    	for (var i = cards.length - 1; i > 0; i--){

        	var j = Math.floor(Math.random() * (i+1));
        	var temp = cards[i];
        	cards[i] = cards[j];
        	cards[j] = temp;
        }

   }

	this.loop = function(){
			var self = this;
			setInterval(function(){self.draw()}, 16);
	}

	this.draw = function(){
		if(action == "home") gs.drawMessage("Let's Give a Try!");
		else if(action == "error") gs.drawMessage("Ups! Try again...");
		else if(action == "ok"){
			if(solved == 2) gs.drawMessage("Yeah! The first one");
			else if(solved <= 10) gs.drawMessage("Very good!");
			else if(solved < 16) gs.drawMessage("Just a little more...!");
			else if(solved == 16){
				gs.drawMessage("CONGRATS!     " + this.tac(time));
				solved++;
			}
		}
		for (var i = 0; i < cards.length; i++){
			cards[i].draw(gs, i);
		}

	}

	this.onClick = function(cardId){
		if(cardId > -1 && cardId != null && !cards[cardId].isFound() && clicks){
			if(up != cardId){
				cards[cardId].flip();
				if(up != null){
					if(cards[cardId].compareTo(cards[up])){
						cards[up].found();
						cards[cardId].found();
						action = "ok";
						solved+=2;
					} else {
						clicks = false;
						action = "error";
						var aux = up;
						setTimeout(function (){
							action = "home";
							cards[aux].flip();
							cards[cardId].flip();
							clicks = true;}, 1000);
					}
					up = null;
					if(solved == 16) setTimeout(this.restart, 2000);
				} else up = cardId;
			}
		}
	}

	this.restart = function(){
		alert("Click below if you want to play again.");
		document.location.reload();
	}
};

MemoryGame.prototype = {
	initGame: function(){
		this.shuffle();
		this.draw();
		time = this.tic();
		this.loop();
	}
}

/**
 * Constructora de las cartas del juego. Recibe como parámetro el nombre del sprite que representa la carta.
 * Dos cartas serán iguales si tienen el mismo sprite.
 * La carta puede guardar la posición que ocupa dentro del tablero para luego poder dibujarse
 * @param {string} id Nombre del sprite que representa la carta
 */
MemoryGame.Card = function(id) {
	var state = "bocaAbajo";
	
	this.getId = function() {
		return id;
	}

	this.isFound = function() {
		return state == "encontrada";
	}

	this.flip = function() {
		if (state == "bocaAbajo") state = "bocaArriba";
		else if (state == "bocaArriba") state = "bocaAbajo";
	}
	
	this.found = function() { state = "encontrada";}
	
	this.compareTo = function(otherCard){
		if (id == otherCard.getId()) return true;
		else return false;
	}

	this.draw = function(gs, pos){
		if (state == "bocaAbajo") gs.draw("back", pos);
		else gs.draw(id, pos);
	}
};


