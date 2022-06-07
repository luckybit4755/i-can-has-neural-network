#!/usr/bin/env node

const nj = require('../util/njeez');
const DataBuddy = require('../util/DataBuddy');
const sprintf = require('sprintf-js').sprintf;

// based on trask examples
module.exports = class ToyNN {
	static ACTIVATION = { relu:'relu', sigmoid:'sigmoid' };

	constructor( shape, activation = ToyNN.ACTIVATION.sigmoid ) {
		this.shape = shape;
		this.weights = new Array( this.shape.length - 1 ).fill( 0 ).map( (r,i) =>
			nj.random( this.shape[ i ], this.shape[ i + 1 ] ).multiply( 2 ).subtract( 1 )
		);

		switch ( activation ) {
			case ToyNN.ACTIVATION.relu: this.activation = this.relu; break;
			default: this.activation = this.sigmoid;
		}
	}

	relu( x, deriv = false ) {
		return ( deriv 
			? x < 0 ? 0 : 1
			: Math.max( 0, x ) 
		);
	}

    sigmoid( z ) {
		if ( !isNaN( z ) ) {
			return 1 / (1 + Math.exp(-z) );
		}
		const a = z.selection.data;
		a.forEach( (v,i) => a[i] = this.sigmoid( v ) );
		return z;
	}

    sigmoid_derivative(z) {
		if ( !isNaN( z ) ) {
			const q = this.sigmoid(z) 
			return q * ( 1 - q ); // from yitong-ren code...
			// return z * ( 1 - z );
		}

		const a = z.selection.data;
		a.forEach( (v,i) => a[ i ] = this.sigmoid_derivative( v ) );
		return z;
	}

	nonlin( x, deriv = false ) {
		if ( nj.isArray( x ) ) return nj.lamda( x, v => this.nonlin( v,deriv ) );
		return this.activation( x, deriv );
	};

	predict( inputs ) {
		let current = nj.isArray( inputs ) ? inputs : nj.array( inputs );
		this.weights.forEach( (w,i) => {
			current = this.nonlin( nj.dot( current, w ) );
		});
		return current;
	}

	oldTrain( trainingData, epochs = 10 * 1000, threshold = .001 ) {
		const inputs = nj.array( trainingData.inputs );
		const labels = nj.array( [trainingData.labels] ).T;

		let output = null;
		for ( let i = 0 ; i < epochs ; i++ ) {
			const layers = this.forwardPropagation( inputs );
			output = layers[ this.shape.length - 1 ];
			const error = this.backPropagation( labels, layers );
			if ( error < threshold ) {
				console.log( 'error threshold beaten at', i, 'of', epochs, 'epochs' );
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

	train( trainingData, learningRate = .001, epochs = 1000 * 10, batchSize = 10, threshold = .0001 ) {
		return this.trainGradientDescent( trainingData, learningRate, epochs, batchSize, threshold ); 
	}

	trainGradientDescent( trainingData, learningRate = .0001, epochs = 1000 * 10, batchSize = 10, threshold = .0001 ) {
		batchSize = Math.min( batchSize, trainingData.inputs.length );
		const max = trainingData.inputs.length - batchSize;

		const tmi = Math.floor( epochs * .1 );

		let output = null;
		let error =  null;
		for ( let epoch = 0 ; epoch < epochs ; epoch++ ) {

			// shuffle?

			for ( let index = 0 ; index < trainingData.inputs.length ; index += batchSize ) {
				const inputs = nj.array( trainingData.inputs.slice(index,index+batchSize) );
				const labels = nj.array( [trainingData.labels.slice(index,index+batchSize)] ).T;

				const layers = this.forwardPropagation( inputs );
				output = layers[ this.shape.length - 1 ];
				error = this.backPropagationGradientDescent( labels, layers, learningRate, epoch );
/*
				if ( Math.abs( error ) < threshold ) {
					console.log( 'error threshold beaten at', epoch, 'of', epochs, 'epochs' );
					break;
				}
*/
			}
/*		
			if ( !( epoch % tmi ) ) {
				console.log(sprintf(
					'average error is %+8.4f'//: %s'
					, error
					//, this.weights[0].selection.data.map(w=>sprintf("%+8.4f",w)).join( ', ' ) 
				));
			}
*/
		}
		return output;
	}


	stringar( a ) {
		return a.selection.data
			.map( v => sprintf( '%+8.4f', v ) )
			.join( ', ' )
		;
	}

	backPropagationGradientDescent( labels, layers, learningRate, currentIteration ) {
		let results = null;
		const lastWeightIndex = this.weights.length - 1;

        const gradients = new Array( this.weights.length );
		const delta = new Array( this.weights.length );

		for ( let i = lastWeightIndex ; i > -1 ; i-- ) {
            const slope = this.sigmoid_derivative( nj.dot( layers[i], this.weights[i] ) );
			const error = ( i == lastWeightIndex
				? nj.subtract( labels, layers[i+1] )
                : nj.dot(delta[i+1], this.weights[i+1].T)
			);
			results = ( null == results ) ? error : results;

            delta[i] = nj.multiply( error , slope );
            gradients[i] = nj.dot( layers[i].T, delta[i] );
		}

        // update weights
		for ( let i = 0 ; i <= lastWeightIndex ; i++ ) {
			const scaled =gradients[i ];// nj.lamda( gradients[i], v => v * learningRate );
            this.weights[i] = nj.add( this.weights[i], scaled );
            //this.weights[i] = nj.add( this.weights[i], gradients[i] )
		}
	}
	
	og_backPropagationGradientDescent( labels, layers, learningRate, currentIteration ) {
		let results = null;

    	const gradients = new Array( this.weights.length );
    	const delta = new Array( this.weights.length );
		const lastWeightIndex = this.weights.length - 1;

		for ( let i = lastWeightIndex ; i > -1 ; i-- ) {
        	const slope = this.nonlin( nj.dot( layers[i], this.weights[i] ), true );
//console.log( 'wtf', slope );
//console.log( 'slope', this.stringar( slope ) );
			const error = ( i == lastWeightIndex 
				? nj.subtract( labels , layers[i+1] )
				: nj.dot( delta[i+1], this.weights[i+1].T )
			)
            delta[i] = nj.multiply( error, slope );
            gradients[i] = nj.dot(layers[i].T, delta[i]);
//console.log( 'error', this.stringar( error ) );
//console.log( 'delta', this.stringar( delta[i] ) );
//console.log( 'gradients', this.stringar( gradients[i] ) );

			if ( !results ) {
				//results = nj.mean( error );
				results = error.selection.data.reduce( (s,v)=>s+v*v, 0 );
			}
		}

		learningRate = 1.;//.01;

		// update the weights
		for ( let i = lastWeightIndex ; i > -1 ; i-- ) {
			const scaled = nj.lamda( gradients[i], v => v * learningRate );
			this.weights[i] = nj.add( this.weights[i], scaled );//gradients[i] );
		}


//process.exit(33)

		return results;
	}

	old_backPropagationGradientDescent( labels, layers, learningRate, currentIteration ) {
		let result = null;

		const deltas = new Array( this.shape.length - 1 ).fill( 0 );

		// feed the error deltas backwards
let a,b,c;
let up, dn;
		for ( let l = 0 ; l < deltas.length ; l++ ) {
			const deltaIndex = deltas.length - l - 1; // 0,1 -> 1,0
			const layerIndex = layers.length - l - 1; // 0,1 -> 2,1
			const error = ( 0 == l
				? nj.subtract( layers[ layerIndex ], labels )
				: nj.dot( deltas[ deltaIndex + 1 ], this.weights[ l ].T )
			);

			if ( !result ) {
				up = error.selection.data.reduce( (s,v)=>v>0?s+v:s, 0 );
				dn = error.selection.data.reduce( (s,v)=>v<0?s+v:s, 0 );
				result = nj.mean( error );
			}

			const slope = this.nonlin( layers[ layerIndex ], true );
			deltas[ deltaIndex ] = nj.multiply( error, slope );
a = error; b = slope; c = deltas[ deltaIndex ];
		}


learningRate = .1;

		// update the weights
		for ( let l = 0 ; l < this.weights.length ; l++ ) {
			const update = nj.dot( layers[l].T, deltas[ l ] );
			const scaled = nj.lamda( update, v => v * learningRate );
			this.weights[ l ] = nj.subtract( this.weights[ l ], scaled );
console.log( 
		sprintf( 'smmry: %8d: %+8.4f : %+8.4f vs %+8.4f -> %+8.4f', currentIteration, result, dn, up, dn + up ) + '\n' +
		'error:', this.stringar( a )      + '\n' +
		'slope:', this.stringar( b )      + '\n' +
		'delta:', this.stringar( c )      + sprintf( '-> %+8.4f\n', c.sum() ) +
		'wtfll:', layers[l].shape + '\n' + //this.stringar( layers[l].T ) + '\n' +
		'updat:', update.shape + '\n' + //this.stringar( update ) + sprintf( '-> %+8.4f\n', update.sum() ) +
		'scald:', this.stringar( scaled ) + '\n' +
		'weigh:', this.stringar( this.weights[ l ] )
);
		}

		return result;
		return Math.abs(result);
	}

};
