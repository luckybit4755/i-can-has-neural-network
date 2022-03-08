#!/usr/bin/env node 

const tf = require('@tensorflow/tfjs-node-gpu');

const create_data = ( count = 10 ) => {
	const labels = new Array( count );
	const data = { 
		labels:labels,
		inputs: new Array( count ).fill( 0 ).map( (_,i) => {
			const v = new Array( 3 ).fill( 0 ).map( _=> Math.random() ).sort( (a,b) => a-b );
			labels[ i ] = [Math.sqrt( v.reduce( (s,x)=>s+x*x, .0 ) )];
			return v;
		})
	}
	return data;
};

const distance_tf = async () => {
	// the hyperparameters

	const learningRate = .0001;
	const batchSize	= 3;
	const epochs	   = 10;

	const trainingSize = 1000 * 17;
	const testingSize  = 1000 * 3;

	// create the model

	const model = tf.sequential();
	model.add( tf.layers.dense( { units:1, inputShape:[3,] } ) )

	model.compile({
		  optimizer: tf.train.rmsprop( learningRate )
		, loss: 'meanSquaredError'
		, metrics: [ tf.metrics.meanSquaredError ]
	})

	// train the model

	const training = create_data( trainingSize )

	const history = await model.fit(
		  tf.tensor2d( training.inputs )
		, tf.tensor2d( training.labels )
		, {
			  batchSize : batchSize
			, epochs : epochs
			, shuffle : true
		}
	);

	//console.log( 'history', history );
	//console.log( 'history.history', history.history );
	//console.log( 'history.epoch', history.epoch );
	model.weights.forEach( weight => {
		console.log( '>weight', weight.read().arraySync().flat() );
	});

	// test the model

	testing = create_data( testingSize );

	await model.evaluate( 
		  tf.tensor2d( testing.inputs )
		, tf.tensor2d( testing.labels )
		, batchSize 
	);

	// the end
};

distance_tf()

// eof
//////////////////////////////////////////////////////////////////////////////
