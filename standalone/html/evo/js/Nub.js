/**
 *
 * Darlin' little nubbin's with a bittle neural
 * brain... that are dtf.. if they live
 *
 */
class Nub {
	static INPUT_SOURCE_COUNT = 15;

	static OUTPUT_CLOCK   = 8 + 0;
	static OUTPUT_IMPULSE = 8 + 1;
	static OUTPUT_COUNT   = 8 + 2; // compass rose, clock, impulseM

	constructor( hiddenCount = null ) {
		this.age = 0;
		this.location = [0,0];
		this.couldMove = true;

		this.createBrain( hiddenCount );

		// FIXME: this does not result in similar colors for 
		// nubs which *seem* to have similar behaviour
		// it may be necessary to actual track ancestors...
		this.color = this.fingerprint();
	}

	createBrain( hiddenCount = null ) {
		this.clock = Util.r1();
		this.impulseM = Util.r1();

		this.layers = new Array();

		// inputs from the environment and such

		this.inputs = Util.randomArray( Nub.INPUT_SOURCE_COUNT );
		this.layers.push( this.inputs );
	
		// configurable hidden layers	

		this.hiddenCount = hiddenCount;
		if ( this.hiddenCount ) {
			this.hiddenCount.forEach( size => 
				this.layers.push( Util.randomArray( size ) )
			);
		}

		// output layers to move in different directions

		this.outputs = Util.randomArray( Nub.OUTPUT_COUNT );
		this.layers.push( this.outputs );

		// randomly assign the weights

		this.weights = new Array( this.layers.length - 1 ).fill( 0 ) .map( (_,i)=> {
			const current = this.layers[ i ];
			const next = this.layers[ i+1 ];
			return Util.randomArray( current.length, next.length );
		});

		// some random biases and recurrence

		this.biases = Util.randomDupe( this.layers );
		this.memory = Util.randomDupe( this.layers );
	}

	clone() {
		return this.rut( this, 0 ); // go on and ... 
	}

	move( evo ) {
		const board = evo.board;
		const generation = evo.generation;

		this.sensors( board, generation );
		this.forwardPropagation( evo.nanCheck );
		this.react( board );

		this.age++;
	}

	/////////////////////////////////////////////////////////////////////////////

	sensors( board, generation ) {
		this.inputs.forEach( (v,i) => {
			const b = this.biases[ 0 ][ i ];
			const k = this.memory[ 0 ][ i ];

			const e = this.input( i, board, generation );
			this.inputs[ i ] = Math.tanh( e + v * k + b );
		});
	}

	// i should be > 0 and <= INPUT_SOURCE_COUNT 
	input( i, board, generation ) {
		const now = new Date().getTime() * .0022;

		if ( i < Util.OFFSETS.length ) {
			// look in 8 directions
			return board.occupied( this.position, Util.OFFSETS[ i ] ) ? 1 : -1; 
		} else {
			switch ( i - Util.OFFSETS.length ) {
				case 0: return Util.toPM( this.position[ 0 ] / board.size );
				case 1: return Util.toPM( this.position[ 1 ] / board.size );
				case 2: return Util.r1();
				case 3: return Math.cos( now * this.clock ); 
				case 4: return Math.sin( now * .25 ); 
				case 5: return Util.toPM( this.age % generation / generation );
				case 6: return this.couldMove ? 1 : -1;
			}
		} // so 8 + max(case) + 1 => INPUT_SOURCE_COUNT value... 
	}

	/////////////////////////////////////////////////////////////////////////////
		
	forwardPropagation( nanCheck = false ) {
		this.weights.forEach( (weight,i) => {
			const prior = this.layers[ i ];
			const next = this.layers[ i + 1 ];

			next.forEach( (v,j)=> {
				const b = this.biases[ i + 1 ][ j ];
				const k = this.memory[ i + 1 ][ j ];
				next[ j ] = Math.tanh( v * k + b );
			});

			this.multiply( prior, weight, next, nanCheck );
			next.forEach( (v,j) => next[ j ] = Math.tanh( v ) );
		});


		//console.log( 'inputs:', this.inputs );
		//console.log( 'outputs:', this.outputs );
	}

	// adapted from https://www.tutorialspoint.com/algorithm-for-matrix-multiplication-in-javascript
	// this is wack cuz layers are not like [ [1],[2] ], just [1,2] ...
	// as a result, it is *not* suitable for general matrix multiplication
	multiply( prior, weight, next, nanCheck = false ) {
		const priorCols = prior.length;
		const weightRows = weight.length;
		const weightCols = weight[ 0 ].length;

		if ( nanCheck ) {
			// ok... bit hokey to reuse the same flag, but whatever...
			if ( priorCols != weightRows || weightCols != next.length ) {
				const message = `size error: 1x${priorCols} * ${weightRows}x${weightCols} -> 1x${weightCols} vs 1 x ${next.length}`;
				throw new Error( message );
			}
		}

		for ( let c = 0; c < weightCols; ++c ) {
			for ( let k = 0; k < priorCols; ++k ) {
				next[ c ] += prior[ k ] * weight[ k ][ c ];
				if ( nanCheck && isNaN( next[ c ] ) ) {
					const message = `NaN: next[${c}] = ${next[c]} = prior[${k}] * weight[${k}][${c}] = ${prior[k]} * ${weight[k][c]};`;
					throw new Error( message );
				}
			}
		}
	}

	/////////////////////////////////////////////////////////////////////////////

	react( board ) {
	   	// this .001 is just made up
		this.clock = Math.tanh( this.clock + this.outputs[ Nub.OUTPUT_CLOCK ] * .001 );

		const impulse = this.impulse();

		this.couldMove = true;
		if ( ( 0 == impulse[ 0 ] && 0 == impulse[ 1 ] ) ) {
			return;
		}
		if ( board.occupied( this.position, impulse ) ) {
			this.couldMove = false;
			return 
		} 

		this.updatePosition( board, impulse );
	}

	// there are a lot of fun ideas to play with here...
	impulse() {
		const i = Util.toOne( this.outputs[ Nub.OUTPUT_IMPULSE ] );
		const v = 1 - i;

		const i1 = this.impulse1();
		const i2 = this.impulse2();

		// FIXME: how to linearly interpolate 3 values :-(
		return [
			Math.round( i * i1[ 0 ] + v * i2[ 0 ] ),
			Math.round( i * i1[ 1 ] + v * i2[ 1 ] )
		];
	}

	// same as impulse0 but more legible
	// positive outputs have chance to fire and contribute to the impulse
	impulse1() {
		const impulse = [0,0];
		Util.OFFSETS.forEach( (offset,i) => {
			const activation = this.outputs[ i ];
			if ( activation < 0 ) return;
			if ( activation > Math.random() ) return;

			impulse[0] += offset[0];
			impulse[1] += offset[1];
		});
		return Util.pmMinMax( impulse )
	}

	// just use the raw output value to scale the impulse
	// works pretty well
	impulse2() {
		const impulse = [0,0];
		Util.OFFSETS.forEach( (offset,i) => {
			const activation = this.outputs[ i ];
			impulse[0] += offset[0] * activation;
			impulse[1] += offset[1] * activation;
		});
		return Util.pmTanh( impulse )
	}

	// pick positive max
	impulse3() {
		let impulse = null;
		let max = -33;
		Util.OFFSETS.forEach( (offset,i) => {
			const activation = this.outputs[ i ];
			if ( activation > 0 && activation > max ) {
				max = activation;
				impulse = offset;
			}
		});
		return impulse ? impulse : [0,0];
	}

	updatePosition( board, impulse ) {
		this.position = board.moveBy( this.position, impulse );
	}

	/////////////////////////////////////////////////////////////////////////////

	rut( that, mutationRate = 1 / 1000 ) {
		const kid = new Nub( this.hiddenCount );

		kid.clock = this.dnaValue( kid.clock, this.clock, that.clock );
		kid.impulseM = this.dnaValue( kid.impulseM, this.impulseM, that.impulseM );

		this.layers.forEach( (thisLayer,i) => {
			this.dna( kid.layers[ i ], thisLayer, that.layers[ i ], mutationRate );
			this.dna( kid.biases[ i ], this.biases[ i ], that.biases[ i ], mutationRate );
			this.dna( kid.memory[ i ], this.memory[ i ], that.memory[ i ], mutationRate );
		});

		this.weights.forEach( (thisWeight,i) => {
			const kidWeight = kid.weights[ i ];
			const thatWeight = that.weights[ i ];
			kidWeight.forEach( (kidRow,j) => {
				this.dna( kidRow, thisWeight[ j ], thatWeight[ j ], mutationRate );
			});
		});

		kid.color = this.fingerprint();
		return kid;
	}

	dna( kid, dad, mom, mutationRate ) {
		kid.forEach( (v,j) => {
			kid[ j ] = this.dnaValue( v, mom[ j ], dad[ j ] );
		});
	}

	// maybe this could be improved to split each float
	// into bits, then do the picks and merge the result...
	dnaValue( kid, dad, mom, mutationRate ) {
		return ( Math.random() < mutationRate ) ? kid
			: Math.random() < .5 ? mom : dad;
	}

	/////////////////////////////////////////////////////////////////////////////

	abomination( that ) {
		this.clock    += that.clock;
		this.impulseM += that.impulseM;

		this.layers.forEach( (thisLayer,i) => {
			this.merge( thisLayer, that.layers[ i ] );
			this.merge( this.biases[ i ], that.biases[ i ] );
			this.merge( this.memory[ i ], that.memory[ i ] );
		});

		this.weights.forEach( (thisWeight,i) => {
			const thatWeight = that.weights[ i ];
			thisWeight.forEach( (thisRow,j) => {
				this.merge( thisRow, thatWeight[ j ] );
			});
		});

		return this;
	}

	merge( a,b ) {
		a.forEach( (_,i) => a[ i ] += b[ i ] );
	}

	scale( count ) {
		this.clock    /= count;
		this.impulseM /= count;

		this.layers.forEach( (thisLayer,i) => {
			this.scaleA( thisLayer, count );
			this.scaleA( this.biases[ i ], count );
			this.scaleA( this.memory[ i ], count );
		});

		this.weights.forEach( (thisWeight,i) => {
			thisWeight.forEach( (thisRow,j) => {
				this.scaleA( thisRow, count );
			});
		});

		return this;
	}

	scaleA( a, count ) {
		a.forEach( (_,i) => a[ i ] /= count );
	}

	/////////////////////////////////////////////////////////////////////////////
/*
	occupied( board, offset = null) {
		const position = offset ? Util.arrayAdd( this.position, offset ) : this.position;
		// consider out of bounds to be occupied
		if ( !this.inBounds( position, board ) ) return true;
		return board[ position[0] ][ position[1] ];
	}

	inBounds( position, board ) {
		const r = position[ 0 ];
		const c = position[ 1 ];
		return !( r < 0 || c < 0 || c >= board[ 0 ].length || r >= board.length );
	}

	boardSet( board, position, value ) {
		const r = position[ 0 ];
		const c = position[ 1 ];
		board[ r ][ c ] = value;
	}
*/

	/////////////////////////////////////////////////////////////////////////////

	fingerprint() {
		let hash = 0;

		[this.layers,this.biases,this.memory].forEach( thing => 
			thing.forEach( stuff => stuff.forEach( v => hash = this.hash( hash, v ) ) )
		);

		this.weights.forEach( (thisWeight,i) => {
			thisWeight.forEach( row => row.forEach( v => hash = this.hash( hash, v ) ) )
		});

		hash = ( hash & hash ) % Math.pow( 2, 24 );
		return `rgb(${hash>>16&255},${hash>>8&255},${hash&255})`;
	}

	hash( hash, v ) {
		const n = 2;
		v = Math.floor( v * n ) + n;
		hash = ((hash<<2)-hash) + v;
		return hash;
	}

	/////////////////////////////////////////////////////////////////////////////
	// bit of friendly brain surgery between friends :-P

	static STATE = 'clock impulseM hiddenCount layers biases memory weights'.split( ' ' );

	getBrain() {
		return Util.copyKeys( Nub.STATE, this );
	}

	setBrain( brain ) {
		return Util.copyKeys( Nub.STATE, brain, this );
	}
};

