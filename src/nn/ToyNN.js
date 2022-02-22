#!/usr/bin/env node

const nj = require('../util/njeez');
const DataBuddy = require('../util/DataBuddy');

// based on trask examples
module.exports = class ToyNN {
	constructor() {
		this.shape = Array.from( arguments );
		this.weights = new Array( this.shape.length - 1 ).fill( 0 ).map( (r,i) =>
			nj.random( this.shape[ i ], this.shape[ i + 1 ] ).multiply( 2 ).subtract( 1 )
		);
	}

	relu( x, deriv = false ) {
		return ( deriv ? x < 0 || x > 1 ? 0 : 1 : Math.min( 1, Math.max( 0, x ) ) );
	}

	sigmoid( x, deriv = false ) {
		return deriv ? x * ( 1 - x ) : 1 / ( 1 + Math.exp( -x ) ); // sigmoid
	}

	nonlin( x, deriv = false ) {
		if ( nj.isArray( x ) ) return nj.lamda( x, v => this.nonlin( v,deriv ) );
		return this.sigmoid( x, deriv );
		return this.relu( x, deriv );
	};

	predict( inputs ) {
		let current = nj.isArray( inputs ) ? inputs : nj.array( inputs );
		this.weights.forEach( (w,i) => {
			current = this.nonlin( nj.dot( current, w ) );
		});
		return current;
	}

	train( trainingData, iterations = 10 * 1000, threshold = .001 ) {
		const inputs = nj.array( trainingData.inputs );
		const labels = nj.array( [trainingData.labels] ).T;

		let output = null;
		for ( let i = 0 ; i < iterations ; i++ ) {
			const layers = this.forwardPropagation( inputs );
			output = layers[ this.shape.length - 1 ];
			const error = this.backPropagation( labels, layers );
			if ( error < threshold ) {
				console.log( 'error threshold beaten at', i, 'of', iterations, 'iterations' );
				break;
			}
		}
		return output;
	}

	forwardPropagation( inputs ) {
		const layers = new Array( this.shape.length );
		layers[ 0 ] = inputs;

		for ( let l = 1 ; l < this.shape.length ; l++ ) {
			const prior = layers[ l - 1 ];
			const weights = this.weights[ l - 1 ];
			layers[ l ] = this.nonlin( nj.dot( prior, weights ) );
		}
		return layers;
	}

	backPropagation( labels, layers ) {
		let result = null;
		let error = null;

		for ( let l = layers.length - 1 ; l > 0 ; l-- ) {
			const layer = layers[ l ];
			const prior = layers[ l - 1 ];

			error = ( null == error
				? nj.subtract( labels, layer )
				: nj.dot( error, this.weights[ l ].T )
			);
			if ( !result ) result = nj.std( error );
			
			const scale = this.nonlin( layer, true );
			const delta = nj.multiply( error , scale );
			const update = prior.T.dot( delta );
			this.weights[ l - 1 ] = nj.add( this.weights[ l - 1 ], update );
		}

		return result;
	}

	/////////////////////

	gradientDescent( inputs, labels, alpha ) {
		const layers = new Array( this.shape.length ).fill(0);
		const deltas = new Array( this.shape.length - 1 ).fill( 0 );

		// feed forward

		let last;
		for ( let l = 0 ; l < layers.length ; l++ ) {
			last = layers[ l ] = ( 0 == l
				? inputs
				: this.nonlin( nj.dot( last, this.weights[ l - 1 ] ))
			);
		}

		// feed the error deltas backwards
		for ( let l = 0 ; l < deltas.length ; l++ ) {
			const deltaIndex = deltas.length - l - 1; // 0,1 -> 1,0
			const layerIndex = layers.length - l - 1; // 0,1 -> 2,1
			const error = ( 0 == l
				? nj.subtract( layers[ layerIndex ], labels )
				: nj.dot( deltas[ deltaIndex + 1 ], this.weights[ l ].T )
			);
			const slope = this.nonlin( layers[ layerIndex ], true );
			deltas[ deltaIndex ] = nj.multiply( error, slope );
		}

		// update the weights

		for ( let l = 0 ; l < this.weights.length ; l++ ) {
			const update = nj.dot( layers[l].T, deltas[ l ] );
			const scaled = nj.lamda( update, v => v * alpha );
			this.weights[ l ] = nj.subtract( this.weights[ l ], scaled );
		}

		return layers[ this.shape.length - 1 ];
	}

	trainGradientDescent( trainingData, alpha = 1, iterations = 1000 * 10, threshold = .0001 ) {
		const inputs = nj.array( trainingData.inputs );
		const labels = nj.array( [trainingData.labels] ).T;
/*
		let t;
		for ( let i = 0 ; i < iterations ; i++ ) {
			t = this.gradientDescent( inputs, labels, alpha );
		}
		return t;
*/

		let output = null;
		for ( let i = 0 ; i < iterations ; i++ ) {
			const layers = this.forwardPropagationGradientDescent( inputs );
			output = layers[ this.shape.length - 1 ];
			const error = this.backPropagationGradientDescent( labels, layers, alpha );
			if ( error < threshold ) {
				console.log( 'error threshold beaten at', i, 'of', iterations, 'iterations' );
				break;
			}
		}
		return output;
	}

	forwardPropagationGradientDescent( inputs ) {
		const layers = new Array( this.shape.length ).fill(0);

		let last;
		for ( let l = 0 ; l < layers.length ; l++ ) {
			last = layers[ l ] = ( 0 == l
				? inputs
				: this.nonlin( nj.dot( last, this.weights[ l - 1 ] ))
			);
		}

		return layers;
	}

	backPropagationGradientDescent( labels, layers, alpha ) {
		let result = null;

		const deltas = new Array( this.shape.length - 1 ).fill( 0 );

		// feed the error deltas backwards

		for ( let l = 0 ; l < deltas.length ; l++ ) {
			const deltaIndex = deltas.length - l - 1; // 0,1 -> 1,0
			const layerIndex = layers.length - l - 1; // 0,1 -> 2,1
			const error = ( 0 == l
				? nj.subtract( layers[ layerIndex ], labels )
				: nj.dot( deltas[ deltaIndex + 1 ], this.weights[ l ].T )
			);

			if ( !result ) result = nj.mean( nj.abs( error ) );

			const slope = this.nonlin( layers[ layerIndex ], true );
			deltas[ deltaIndex ] = nj.multiply( error, slope );
		}

		// update the weights

		for ( let l = 0 ; l < this.weights.length ; l++ ) {
			const update = nj.dot( layers[l].T, deltas[ l ] );
			const scaled = nj.lamda( update, v => v * alpha );
			this.weights[ l ] = nj.subtract( this.weights[ l ], scaled );
		}

		return layers[ this.shape.length - 1 ];
	}
};
