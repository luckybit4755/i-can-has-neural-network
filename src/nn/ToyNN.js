#!/usr/bin/env node

const nj = require('../util/njeez');
const DataBuddy = require('../util/DataBuddy');
const sprintf = require('sprintf-js').sprintf;

// based on trask examples
///module.exports = 
class ToyNN {
	static ACTIVATION = { relu:'relu', sigmoid:'sigmoid' };

	constructor( shape, activation = ToyNN.ACTIVATION.sigmoid ) {
		this.shape = shape;
		this.weights = new Array( this.shape.length - 1 ).fill( 0 ).map( (r,i) =>
			nj.random( this.shape[ i ], this.shape[ i + 1 ] ).multiply( 2 ).subtract( 1 )
		);


		//this.weights[0]=nj.array( [[.2],[.4],[.9]] ); console.log('wt',this.weights[0].selection.data);

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

	sigmoid( x, deriv = false ) {
		return deriv 
			? x * ( 1 - x ) 
			: 1 / ( 1 + Math.exp( -x ) 
		);
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

	trainGradientDescent( trainingData, alpha = 1, iterations = 1000 * 10, threshold = .0001, batchSize = 10 ) {
		const max = trainingData.inputs.length - batchSize;

		let output = null;
		for ( let i = 0 ; i < iterations ; i++ ) {
		
			const q = Math.floor( Math.random() * max );
			const inputs = nj.array( trainingData.inputs.slice(q,q+batchSize) );
			const labels = nj.array( [trainingData.labels.slice(q,q+batchSize)] ).T;

			//const layers = this.forwardPropagationGradientDescent( inputs );
			const layers = this.forwardPropagation( inputs );
			output = layers[ this.shape.length - 1 ];
			const error = this.backPropagationGradientDescent( labels, layers, alpha, i );
/*
			if ( error < threshold ) {
				console.log( 'error threshold beaten at', i, 'of', iterations, 'iterations' );
				break;
			}
*/

			if ( !( i % 1000 ) ) {
				console.log(sprintf(
					'average error is %+8.4f: %s'
					, error
					, this.weights[0].selection.data.map(w=>sprintf("%+8.4f",w)).join( ', ' ) 
				));
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

	backPropagationGradientDescent( labels, layers, alpha, currentIteration ) {
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

			if ( !result ) {
				result = nj.mean( error );
				//result = nj.mean( nj.abs( error ) );
/*
if ( 0 == currentIteration % 1000 ) {
for ( let fff = 0 ; fff < layers[layerIndex].selection.data.length ; fff++ ) {
	const n = layers[layerIndex].selection.data[fff];
	const r = labels.selection.data[fff];
	const d = n - r;
	const e = error.selection.data[fff]
	console.log(sprintf('nn:%+8.4f, lbl:%+8.4f is %+8.4f = %+8.4f, mean:%+8.4f, sum:%+8.4f', n, r, d, e, result, nj.sum(error) ));
}
}
*/
			}

			const slope = this.nonlin( layers[ layerIndex ], true );
			deltas[ deltaIndex ] = nj.multiply( error, slope );

/*
if ( !l ) {
	const a = layers[ layerIndex ].selection.data[0];
	const b = labels.selection.data[0];
	const e = error.selection.data[0];
	const s = slope.selection.data[0];
	const d = deltas[ deltaIndex ].selection.data[ 0 ];
	console.log( a,'vs',b,'is',e, 'slope', s, '->', d );
}
*/
//console.log( nj.mean( error ) );

		}

		// update the weights
		for ( let l = 0 ; l < this.weights.length ; l++ ) {
			const update = nj.dot( layers[l].T, deltas[ l ] );
			const scaled = nj.lamda( update, v => v * alpha );
			this.weights[ l ] = nj.subtract( this.weights[ l ], scaled );
		}

		return result;
		return Math.abs(result);
	}

};




    const toyDistance = new ToyNN( [3, 1], ToyNN.ACTIVATION.relu );

    const sort = true;

    const trainingData = DataBuddy.createDistanceTrainingData( 1000 * 10 , sort );
    //const trainingResult = toyDistance.train( trainingData, 1000 * 10 );

	const alpha = .0001;//.0001;
    const trainingResult = toyDistance.trainGradientDescent( trainingData, alpha, 1000 * 100  );



///    trainGradientDescent( trainingData, alpha = 1, iterations = 1000 * 10, threshold = .0001 ) {


    const validationData = DataBuddy.createDistanceTrainingData( 1000, sort );
    const predictions = toyDistance.predict( validationData.inputs );

    console.log(
        'training    variance is', DataBuddy.variance( trainingResult.selection.data, trainingData.labels )
        + '\n' +
        'predictions variance is', DataBuddy.variance( predictions.selection.data, validationData.labels )
    );

    toyDistance.weights.forEach( (w,i) => console.log( `w${i} =`, nj.toArray( w.T ) ) );

    const output = nj.array( predictions.selection.data );
    const labels = nj.array( validationData.labels );

    const error = nj.mean( nj.abs( nj.subtract( output, labels ) ) );
    console.log( 'average error is', error );

