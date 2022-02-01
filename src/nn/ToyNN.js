#!/usr/bin/env node

const nj = require('../util/njeez');

// based on trask examples
module.exports = 
class ToyNN {
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

	train( trainingData, iterations = 10 * 1000, threshold = -33 ) {
		const inputs = nj.array( trainingData.inputs );
		const labels = nj.array( [trainingData.labels] ).T;

		let output = null;
		for ( let i = 0, error = 2022 ; i < iterations /*&& error > threshold*/ ; i++ ) {
			const layers = new Array( this.shape.length );
			layers[ 0 ] = inputs;

			// forward
			for ( let l = 1 ; l < this.shape.length ; l++ ) {
				const prior = layers[ l - 1 ];
				const weights = this.weights[ l - 1 ];
				layers[ l ] = this.nonlin( nj.dot( prior, weights ) );
			}
			output = layers[ this.shape.length - 1 ];

			// backwards
			let error = null;
			for ( let l = layers.length - 1 ; l > 0 ; l-- ) {
				const layer = layers[ l ];
				const prior = layers[ l - 1 ];

				error = (
					error 
					? nj.dot( error, this.weights[ l ].T )
					: nj.subtract( labels , layer )
				);
				
				const scale = this.nonlin( layer, true );
        		const delta = nj.multiply( error , scale );
				const update = prior.T.dot( delta );

        		this.weights[ l - 1 ] = nj.add( this.weights[ l - 1 ], update );
			}
		}
		return output;
	}
};

