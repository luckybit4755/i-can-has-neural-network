/** 
 *
 * Handles the management of the generations and drawing routines
 * Probably shoudl separate it out at some point.
 *
 */
class Evo extends Drawing {
	constructor( canvas = null ) {
		super( canvas );
	}

	// 0> 4:43, 7:90, 5,4,6:107
	// 0> 3:74, 4:47, 7:51, 5,4,6:80  (bias and memory from here)
	// 1> 3:36, 4:48, 7:70, 5,4,6:96  
	// 2> 3:58, 4:60, 7:41, 5,4,6:79, 6,4:95%@145  <- percents
	configure( 
		hidden = [3,3], 
		size = 128, 
		nubCount = 200, 
		generation = 300, 
		mechanism = 2, 
		iterationsPerFrame = 10,
		maxSurvival = 95,
		maxGenerations = 128,
		mutationRate = 1 / 1000
	) {
		this.hidden = hidden;
		this.size = size;
		this.nubCount = nubCount;
		this.generation = generation;
		this.mechanism = mechanism
		this.iterationsPerFrame = iterationsPerFrame;

		// couple of cut-offs 
		this.maxSurvival = maxSurvival;
		this.maxGenerations = maxGenerations;

		this.mutationRate = mutationRate;

		this.scale = parseInt( this.w ) / this.size;

		// how long the trail for a nub should be
		// longer is more snake and shorter is more 
		// birds or butterfly
		this.trail = 4; 

		this.fps = 44;
		this.reset();
	}

	reset() {
		this.survivalCounts = [];

		this.done = false; // and with strange aeons ...
		this.summarized = false; 

		// everyone loves counters!
		this.iteration = 0;
		this.paused = 0;
		this.sarnathCounter = 0;

		this.skipRequested = false;
		this.apotheosized = false;

		this.lastBest = 0;

		// here they are!
		this.nubs = new Array( this.nubCount ).fill( 0 ).map( _=>new Nub( this.hidden ) );
		this.board = new Board( this.nubs, this.size );

		/*
		// super slow and weird... idk... may need a rewrite to leverage it...
		this.gpuKernels = this.nubs[ 0 ].createGpuKernels();
		console.log('hi', this.gpuKernels );
		this.nubs.forEach( nub=>nub.gpuKernels = this.gpuKernels );
		*/

		return this;
	}

	placeNubs() {
		this.board.reset( this.nubs );
	}

	run() {
		this.sarnathCounter--;
		this.paused--;

		if ( this.paused-- > 0 ) {
			return this.nextFrame();
		}

		if ( this.winners ) {
			this.spawn( this.winners );
			this.winners = null;
		}

		this.clear();
		this.drawMechanism();

		if ( this.skipRequested ) {
			this._skip();
		} else {
			this.move();
		}

		if ( this.done && !this.summarized ) {
			this.summarized = true;
			this.finalAnalyse();
		} else {
			this.drawGraph( this.survivalCounts, this.done );
			this.drawLegend( this.iteration, this.generation, this.survivalCounts, this.nubs.length, this.sarnathCounter );
		}

		this.nextFrame();
	}

	move( drawing = true ) {
		for ( let t = 0 ; t < this.iterationsPerFrame ; t++ ) {
			this.incrementIteration();

			this.nubs.forEach( nub => {
				nub.move( this );
				if ( drawing && t > this.iterationsPerFrame - this.trail ) {
					this.drawNub( nub );
				}
			});

			if ( this.done ) continue; // no more death, no more birth

			if ( this.doom() ) {
				this.sarnath();
				if ( this.iterationsPerFrame > this.generation ) {
					this.paused = this.fps * .01 + 1;
				} else {
					this.paused = this.fps;
				}
				this.drawFinalState();
				break;
			}
		}
	}

	incrementIteration() {
		if ( this.done ) return;
				
		this.iteration++;
		if ( this.iteration > this.maxGenerations * this.generation ) {
			this.setDone();
		}
		return this.done;
	}

	setDone() {
		if ( !this.done && this.iterationsPerFrame > 10 ) {
			this.iterationsPerFrame = 10;
		}
		this.done = true;
	}

	skip( count = 10 ) {
		this.skipRequested = count;
	}

	_skip() {
		const count = this.skipRequested;
		this.skipRequested = false;

		const y = this.h * .93;
			
		this.fillText( `skipping from ${this.iteration}`, 12, y );

		for ( let i = 0 ; i < count && !this.done ; i++ ) {
			while( true ) {
				if( this.incrementIteration() ) break;
				this.nubs.forEach( nub=>nub.move(this) );
				if ( this.doom() ) {
					this.sarnath();
					this.spawn( this.winners );
					this.winners = null;
					break;
				}
			}
		}
		this.fillText( `to ${this.iteration}`, 33, y );
	}

	doom() {
		return 0 == this.iteration % this.generation;
	}

	sarnath() {
		let winners = this.nubs.filter( nub => this.survived( nub ) );

		this.sarnathCounter = this.generation / this.iterationsPerFrame * .33 + 3;

		if ( winners.length < 2 ) {
			// what did you do to all the lovely nubblies?
			this.setDone();
			return 0;
		}

		const percent = Math.floor( 100 * winners.length / this.nubCount );

		/*
		// experimental
		if ( percent > this.lastBest ) {
			this.lastBest = percent;
			this.bestWinners = winners;
		} else {
			winners = this.bestWinners;
			console.log( percent, '<', this.lastBest );
		}
		*/

		this.survivalCounts.push( percent );

		// bit hacky... don't spawn if we are done...
		if ( percent >= this.maxSurvival ) {
			this.setDone();
			return percent;
		}

		// delay spawing until sarnathCounter is zero
		// mark everyone as dead (sad!) and revive the winners

		this.nubs.forEach( nub=>nub.dead = true );
		winners.forEach( winner=>winner.dead = false );

		this.winners = winners;
		//this.spawn( winners );
		
		if ( percent > this.maxSurvival ) {
			this.setDone();
		}		

		return percent;
	}

	spawn( winners ) {
		const nextGeneration = new Array( this.nubCount ).fill( 0 ).map( _=> {
			const mom = winners[ Math.floor( Math.random() * winners.length ) ];
			const dad = winners[ Math.floor( Math.random() * winners.length ) ];
			return dad.rut( mom, this.mutationRate ); // :-D
		});

		this.nubs = nextGeneration;
		this.nubs.forEach( nub=>nub.gpuKernels = this.gpuKernels );

		this.placeNubs();
	}

	// where the mantle of godhood descends there too we find madness!
	apotheosis() {
		if ( !this.done ) {
			return console.log( 'it is too soon...' );
		}
		if ( this.apotheosized ) {
			return console.log( 'the refulgent is among us!' );
		}

		const theRefulgent = this.nubs[ 0 ];
		this.nubs.forEach( (nub,i) => i ? theRefulgent.abomination( nub ) : nub );
		theRefulgent.scale( this.nubs.length );
		this.nubs.forEach( (nub,i) => this.nubs[ i ] = i ? theRefulgent.clone() : theRefulgent );
		this.placeNubs();

		console.log( 'praise him!', JSON.stringify( theRefulgent.getBrain() ) );
	}

	/////////////////////////////////////////////////////////////////////////////

	nextFrame() {
		if ( this.timeout ) {
			clearTimeout( this.timeout );
		}
		this.timeout = setTimeout( () => requestAnimationFrame( ()=>this.run() ) , 1000 / this.fps );
	}

	finalAnalyse() {
		this.printFinalState();
		this.drawFinalState();
	}

	drawFinalState() {
		super.drawFinalState( this.nubs, this.survivalCounts, this.iteration, this.generation, this.sarnathCounter, this.done );
	}

	printFinalState() {
		const o = Util.copyKeys( 'survivalCounts', this );
		console.log( JSON.stringify( o ) );
	}

	/////////////////////////////////////////////////////////////////////////////
	// new mechanisms need to be added here

	drawMechanism() {
		this.context.strokeStyle = this.context.fillStyle = 'rgba(0,255,0,.4)';
		const w = this.w * .5;
		const h = this.h * .5;

		//return this.debugMechanism();

		switch( this.mechanism ) {
			case 1:  this.fillRect( this.w * .75 ); break
			case 2:  this.fillArc( w, h, h * .5 ); break;
			case 3:  
				this.context.strokeStyle = this.context.fillStyle;
				this.context.lineWidth = this.w * .18;
				this.line( 0,0, this.w,this.h );
				this.line( 0,this.h, this.w,0 );
				break;
			default: this.fillRect( 0, this.h * .666 ); 
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
			case 1: return x > this.w * .75 && x < this.w && 0 < y && y < this.h;
			case 2: return this.insideCircle( x,y, w,h, h * .5 );
			case 3: 
				return (
					   ( Math.abs( x - y ) < w * .25 )
					|| (Math.abs( x - this.w + y ) < w * .25 )
				)
			default: return y > this.h * .666 && y < this.h && 0 < x && x < this.w;
		}
	}
};
