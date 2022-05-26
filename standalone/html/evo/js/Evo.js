/** 
 *
 * Handles the management of the generations and drawing routines
 * Probably shoudl separate it out at some point.
 *
 */
class Evo {
	constructor( canvas = null ) {
		this.canvas = canvas || document.getElementsByTagName( 'canvas' )[ 0 ];
		this.context = this.canvas.getContext( '2d' );
		this.context.font = '22px Comic-Sans';

		this.w = parseInt( this.canvas.width );
		this.h = parseInt( this.canvas.height );
	}

	// 0> 4:43, 7:90, 5,4,6:107
	// 0> 3:74, 4:47, 7:51, 5,4,6:80  (bias and memory from here)
	// 1> 3:36, 4:48, 7:70, 5,4,6:96  
	// 2> 3:58, 4:60, 7:41, 5,4,6:79  <- percents
	configure( 
		hidden = [3,3], 
		size = 128, 
		nubCount = 200, 
		generation = 300, 
		mechanism = 2, 
		iterationsPerFrame = 10,
		maxSurvival = 95,
		maxGenerations = 128
	) {
		this.size = size;
		this.nubCount = nubCount;
		this.generation = generation;
		this.mechanism = mechanism
		this.iterationsPerFrame = iterationsPerFrame;

		// couple of cut-offs 
		this.maxSurvival = maxSurvival;
		this.maxGenerations = maxGenerations;

		this.scale = parseInt( this.w ) / this.size;

		// how long the trail for a nub should be
		// longer is more snake and shorter is more 
		// birds or butterfly
		this.trail = 4; 

		this.fps = 22

		this.survivalCounts = [];

		this.done = false; // and with strange aeons ...
		this.summarized = false; 

		// everyone loves counters!
		this.lastSurviverCount = 0;
		this.sarnathCounter = 0;
		this.iteration = 0;
		this.paused = 0;

		// here they are!
		this.nubs = new Array( this.nubCount ).fill( 0 ).map( _=>new Nub( hidden ) );
		this.placeNubs();

		return this;
	}

	placeNubs() {
		this.board = new Array( this.size ).fill( this.size ).map( _=> new Array( this.size ).fill( false ) );
		this.nubs.forEach( nub=> {
			while( true ) {
				const r = Math.floor( Math.random() * this.size );
				const c = Math.floor( Math.random() * this.size );
				if ( !this.board[ r ][ c ] ) {
					nub.position = [ r, c ];
					this.board[ r ][ c ] = nub;
					break;
				}
			}
		});
	}

	run() {
		if ( this.paused-- > 0 ) {
			return this.nextFrame();
		}

		this.sarnathCounter--;
		if ( 1 > this.sarnathCounter && this.winners ) {
			this.spawn( this.winners );
			this.winners = null;
		}

		this.clear();
		this.drawMechanism();

		this.move();

		if ( this.done && !this.summarized ) {
			this.summarized = true;
			this.finalAnalyse();
		} else {
			this.drawGraph();
			this.drawLegend();
			this.nextFrame();
		}
	}

	move() {
		for ( let t = 0 ; t < this.iterationsPerFrame ; t++ ) {
			if ( !this.done ) {
				// no more counting...
				this.iteration++;
				if ( ++this.iteration > this.maxGenerations * this.generation ) {
					this.done = true;
				}
			}

			this.nubs.forEach( nub => {
				nub.move( this );
				// pretty busy but sort of fun... 
				if ( t > this.iterationsPerFrame - this.trail ) {
					this.drawNub( nub );
				}
			});

			if ( !this.done && 0 == this.iteration % this.generation ) {
				// no more death :-) ... or birth :-/
				const survived = this.sarnath();
				this.paused = this.fps;
				this.done = ( 0 == survived ) || ( survived >= this.maxSurvival );
			}
		}
	}

	sarnath() {
		const winners = this.nubs.filter( nub => this.survived( nub ) );
		this.lastSurviverCount = winners.length;
		this.sarnathCounter = this.generation / this.iterationsPerFrame * .33 + 3;

		if ( winners.length < 2 ) {
			// what did you do to all the lovely nubblies?
			this.done = true;
			return 0;
		}

		const percent = Math.floor( 100 * winners.length / this.nubCount );

		this.survivalCounts.push( percent );

		// bit hacky... don't spawn if we are done...
		if ( percent >= this.maxSurvival ) {
			this.done = true;
			return percent;
		}

		// delay spawing until sarnathCounter is zero
		// mark everyone as dead (sad!) and revive the winners

		this.nubs.forEach( nub=>nub.dead = true );
		winners.forEach( winner=>winner.dead = false );
		this.winners = winners;

		return percent;
	}

	spawn( winners ) {
		const nextGeneration = new Array( this.nubCount ).fill( 0 ).map( _=> {
			const mom = winners[ Math.floor( Math.random() * winners.length ) ];
			const dad = winners[ Math.floor( Math.random() * winners.length ) ];
			return dad.rut( mom ); // :-D
		});

		this.nubs = nextGeneration;
		this.placeNubs();
	}

	/////////////////////////////////////////////////////////////////////////////
	// drawing routines

	clear( color = 'rgba(255,255,255,.84)' ) {
		this.context.fillStyle = color;
		this.fillRect();
	}

	drawGraph() {
		this.context.lineWidth = 3;
		this.context.strokeStyle = 'green';
		this.context.beginPath();

		const w = 10;

		// make sure it fits on the screen...

		const counts = this.survivalCounts.length * w > this.w 
			? this.survivalCounts.slice( -this.w / w + 1 )
			: this.survivalCounts;

		// draw the line graph

		counts.forEach( (v,x)=> {
			const y = this.graphY( v );
			x *= w;
			x ? this.context.lineTo( x,y ) : this.context.moveTo( x,y );
		});
		this.context.stroke()

		// label latest min / max values

		let min = 110, minX = -1;
		let max = -99, maxX = -1;

		counts.forEach( (v,x)=> {
			if ( v <= min ) {
				min = v;
				minX = x;
			}
			if ( v >= max ) {
				max = v;
				maxX = x;
			}
		});
		//console.log( `min ${min} at ${minX} ; max ${max} at ${maxX}` );

		if ( min == max ) return; // too boring and looks dumb

		const o = w * 1;
		const oldFont = this.context.font;
		this.context.font = '12px Comic-Sans'
		this.context.fillStyle = 'green';
		this.context.fillText( `${min}%`, minX * w + 0, this.graphY( min ) + o );
		this.context.fillText( `${max}%`, maxX * w + 0, this.graphY( max ) - o );
		this.context.font = oldFont;
	}

	graphY( v ) {
		return this.h - this.h * v / 100;
	}

	drawLegend() {				
		this.context.fillStyle = 'lightgray'
		this.fillRect(20,1,280,24);

		const g = Math.floor( this.iteration / this.generation );
		let i = '' + this.iteration % this.generation;
		while ( i.length < 3 ) i = `0${i}`;

		const sg = `${g}.${i}`;
		const sc = this.survivalCounts.length
			? `: ${this.survivalCounts.slice(-3).map( p=>`${p}%`).join( ', ' )}`
			: '';
		const m = `${sg}${sc}`;

		this.context.fillStyle = 'black';
		this.context.fillText( m, 22, 22 );

		if ( this.sarnathCounter < 0 ) return;

		this.context.fillStyle = 'red';
		const s = `${this.lastSurviverCount} of ${this.nubCount} survived`;
		this.context.fillText( s, this.w * .30, this.h * .88 );
	}

	drawNub( nub ) {
		const r = nub.position[ 0 ];
		const c = nub.position[ 1 ];
		const x = c * this.scale;
		const y = r * this.scale;

		this.context.fillStyle = nub.dead 
			? ( Util.r1() < 0 ? 'lightgray' : 'gray' )
			: nub.color;
		this.fillRect( x, y, this.scale, this.scale );
	}

	fillRect( x = 0, y = 0, w = this.w, h = this.h ) {
		this.context.fillRect( x, y, w, h);
	}

	fillArc( x = 0, y = 0, r = 5, s=0, e = 2 * Math.PI) {
		this.context.beginPath();
		this.context.arc( x,y,r,s,e );
		this.context.closePath();
		this.context.fill();
		this.context.stroke();
	}

	line( x0, y0, x1, y1 ) {
		this.context.beginPath();
		this.context.moveTo( x0, y0 );
		this.context.lineTo( x1, y1 );
		this.context.closePath();
		this.context.stroke();
	}

	finalAnalyse() {
		this.printFinalState();
		this.drawFinalState();
	}

	printFinalState() {
		const o = Util.copyKeys( 'survivalCounts', this );
		console.log( JSON.stringify( o ) );
	}

	drawFinalState() {
		this.clear( 'white' );
		this.drawMechanism();
		this.nubs.forEach( nub=> this.drawNub( nub ) );
		this.drawGraph();
		this.drawLegend();
	}

	nextFrame() {
		if ( this.timeout ) {
			clearTimeout( this.timeout );
		}
		this.timeout = setTimeout( () => requestAnimationFrame( ()=>this.run() ) , 1000 / this.fps );
	}

	// sometimes this is easier to create the drawMechanism for new ones
	debugMechanism() {
		const imageData = this.context.getImageData( 0, 0, this.w,this.h);
		let index = 0;
		for( let y = 0 ; y < this.h ; y++ ) {
			for( var x = 0 ; x < this.w ; x++ ) {
				const k = this.survivedXY( x, y );
				imageData.data[ index++ ] = 0;
				imageData.data[ index++ ] = 0;
				imageData.data[ index++ ] = 255;
				imageData.data[ index++ ] = k?255:0;
			}
		}
		this.context.putImageData( imageData, 0, 0 );
	}

	/////////////////////////////////////////////////////////////////////////////
	// miscellanous geometry

	insideCircle( x,y, cx,cy, radius ) {
		const xd = x - cx;
		const yd = y - cy;
		return ( xd * xd + yd * yd ) < ( radius * radius );
	}

	/////////////////////////////////////////////////////////////////////////////
	// new mechanisms need to be added here

	drawMechanism() {
		this.context.fillStyle = 'rgba(0,255,0,.4)';
		const w = this.w * .5;
		const h = this.h * .5;

		// this.debugMechanism();

		switch( this.mechanism ) {
			case 1:  this.fillRect( this.w * .75 ); break
			case 2:  this.fillArc( w, h, h * .5 ); break;
			case 3:  
				this.context.strokeStyle = this.context.fillStyle;
				this.context.lineWidth = this.w * .18;
				this.line( 0,0, this.w,this.h );
				this.line( 0,this.h, this.w,0 );
				break;
			default: this.fillRect( 0, this.h * .5 ); 
		}
	}

	survived( nub ) {
		return this.survivedXY(
			this.scale * nub.position[ 1 ],
			this.scale * nub.position[ 0 ]
		);
	}

	survivedXY( x, y ) {
		const w = this.w * .5;
		const h = this.h * .5;

		switch( this.mechanism ) {
			case 1: return x > w * .75;
			case 2: return this.insideCircle( x,y, w,h, h * .5 );
			case 3: return (
					( Math.abs( x - y ) < w * .25 )
					|| (Math.abs( x - this.w + y ) < w * .25 )
				)
			default: return y > h;
		}
	}
};
