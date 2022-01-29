#!/usr/bin/env node

const nj = require('../util/njeez');

// based on trask examples
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
			//console.log( output.selection.data.map( v => Math.floor( v * 10000 ) / 10000 ).join( ', ' ) );

			// backwards
			for ( let l = this.weights.length - 1 ; l >= 0; l-- ) {
				const weights = this.weights[ l ];
				const layer0 = layers[ l ];
				const layer1 = layers[ l + 1 ];

//				console.log( 'b', l, 'compare', l+1, 'to labels', layer1.shape,'to', labels.shape );

				const error1 = nj.subtract( labels, layer1 ); // FIXME: labels or prior layer???
				const error1Scale = this.nonlin( layer1, true );
				const scaledError1 = nj.multiply( error1, error1Scale );
				const update1 = nj.dot( layer0.T, scaledError1 );

				this.weights[l] = nj.add( weights, update1 );
				this.weights[l].error = nj.dot( error1.T, error1 ).selection.data[ 0 ];
			}
		}
		return output;
	}

	static createDataColumn0( count = 10 ) {
		const inputs = new Array( 10 ).fill( 0 ).map( 
			(r,i) => new Array( 3 ).fill( 0 ).map(
				(c,j) => j ? Math.random() : i % 2
			)
		);
		const labels = inputs.map( r => r[ 0 ] );
		return { inputs:inputs, labels:labels };
	}
};

module.exports = ToyNN;
