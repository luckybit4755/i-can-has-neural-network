#!/usr/bin/env node 

/*
sudo apt -y install libcuda1
npm i @tensorflow/tfjs-node-gpu

https://www.tensorflow.org/js/guide/layers_for_keras_users
*/

//const tf = require('@tensorflow/tfjs');
//const tf = require('@tensorflow/tfjs-node');
const tf = require('@tensorflow/tfjs-node-gpu');
const DataBuddy = require( '../util/DataBuddy' );
const nj = require('../util/njeez');

/*
============================
Hi there 👋. Looks like you are running TensorFlow.js in Node.js. To speed th

============================
> model.add(tf.layers.dense({units: 1, activation: 'linear'}));
> model.compile({optimizer: 'sgd', loss: 'meanSquaredError'});
> const xs = tf.randomNormal([100, 10]);
> const ys = tf.randomNormal([100, 1]);
> model.fit(xs, ys, {
...   epochs: 100,
...   callbacks: {
.....     onEpochEnd: (epoch, log) => console.log(`Epoch ${epoch}: loss = ${log.loss}`)
.....   }
... });
*/

const SHAPE_TO_TYPE = {
	'1':   'float', 
	'2':   'vec3',  
	'3':   'vec3',  
	'3x1': 'vec3',  
	'3x3': 'mat3',  
	'4x4': 'mat4',  
};

const SHAPE_TO_VALUE = {
	'1':   (d) => d[0],
	'2':   (d) => `vec2( ${d[0]}, ${d[1]} )`,
	'3':   (d) => `vec3( ${d[0]}, ${d[1]}, ${d[2]} )`,
	'3x1': (d) => `vec3( ${d[0]}, ${d[1]}, ${d[2]} )`,
	'3x3': (d) => { 
		let i = 0;
		return 'mat3(\n'
			+ `\t\tvec3( ${d[i++]}, ${d[i++]}, ${d[i++]} ),\n`
			+ `\t\tvec3( ${d[i++]}, ${d[i++]}, ${d[i++]} ),\n`
			+ `\t\tvec3( ${d[i++]}, ${d[i++]}, ${d[i++]} )\n`
			+ '\t)'
	},
	'4x4': (d) => {
		let i = 0;
		return 'mat4(\n'
			+ `\tvec4( ${d[i++]}, ${d[i++]}, ${d[i++]}, ${d[i++]} ),\n`
			+ `\tvec4( ${d[i++]}, ${d[i++]}, ${d[i++]}, ${d[i++]} ),\n`
			+ `\tvec4( ${d[i++]}, ${d[i++]}, ${d[i++]}, ${d[i++]} ),\n`
			+ `\tvec4( ${d[i++]}, ${d[i++]}, ${d[i++]}, ${d[i++]} )\n`
			+ ')'
	}
};

class DistanceTf {
	constructor() {
	} 

	createSortedModel( learningRate = .001 ) {
		const model = tf.sequential();
		model.add(tf.layers.dense({units:1, inputShape:[3,]}))

		model.compile({
			optimizer: tf.train.rmsprop( learningRate )
			, loss: 'meanSquaredError' 
			, metrics: [ tf.metrics.meanSquaredError ]
		})
		return model
	}

	createUnSortedModel( learningRate = .001 ) {
		const model = tf.sequential();
		model.add(tf.layers.dense({ units:3, activation:'relu', inputShape:[3] }));
		model.add(tf.layers.dense({ units:3, activation:'relu', biasRegularizer:tf.regularizers.l2() } ));

		//model.add(tf.layers.dense({ units:4, activation:'relu', inputShape:[3] }));
		//model.add(tf.layers.dense({ units:4, activation:'relu', } ));//biasRegularizer:tf.regularizers.l2() } )); 

		model.add(tf.layers.dense({ units:1, name:'Output'}))

		model.compile({
			optimizer: tf.train.rmsprop( learningRate )
			, loss: 'meanSquaredError' 
			, metrics: [ tf.metrics.meanSquaredError ]
		})
		return model
	}

	createModel( learningRate = .001, sorted = !false ) {
		return sorted ? this.createSortedModel() : this.createUnSortedModel();
				
		//model.add(tf.layers.dense({units: 100, activation: 'relu', inputShape: [10]}));
		//model.add(tf.keras.layers.Dense(units=3, activation='relu', name='Hidden1'))
    	//model.add(tf.keras.layers.Dense(units=3, activation='relu', name='Hidden2'))

		if ( sorted ) {
			if( !true ) { 
				model.add(tf.layers.dense({
					 // units:3
					  units:1
					, inputShape: [3,]
					, biasRegularizer: tf.regularizers.l1()	
					, activation: 'relu'
					//, kernelRegularizer:tf.regularizers.l2()	
				}))
				//model.add(tf.layers.dense({units:1, name:'Output'}))
			} else { 
				model.add(tf.layers.dense({units:1, inputShape:[3,]}))
			}
		} else {
			// unsorted is quite a bit trickier
			model.add(tf.layers.dense({ units:3, activation:'relu', inputShape:[3] }));
			model.add(tf.layers.dense({ units:3, activation:'relu', biasRegularizer:tf.regularizers.l2() } )); 

			// biasRegularizer:tf.regularizers.l2()
			model.add(tf.layers.dense({units:1, name:'Output'}))
		}
/*
		model.compile(
			optimizer=tf.keras.optimizers.RMSprop(learning_rate=my_learning_rate),
			loss="mean_squared_error",
			metrics=[tf.keras.metrics.RootMeanSquaredError()]
		)
*/
		model.compile({
			optimizer: tf.train.rmsprop( learningRate )
			, loss: 'meanSquaredError' 
			, metrics: [ tf.metrics.meanSquaredError ]
			/*
			optimizer: tf.train.sgd( learningRate )

			loss could be:
				meanSquaredError               meanAbsoluteError   meanAbsolutePercentageError
				meanSquaredLogarithmicError    squaredHinge        hinge                       
				categoricalHinge               logcosh             categoricalCrossentropy     
				sparseCategoricalCrossentropy  binaryCrossentropy  kullbackLeiblerDivergence   
				poisson                        cosineProximity
			*/
		});
		return model;
	}

	async main( args ) {
		/////////////////////////////////

		const sorted = !true;

		const learningRate = sorted ? .001 : .001;
		const epochs       = sorted ? 10   : 22;
		const batchSize    = sorted ? 100  : 44;

		/////////////////////////////////

		const model = this.createModel( learningRate, sorted );

		DataBuddy.printLine();
		console.log( 'model before training' );
		model.summary();
		DataBuddy.printLine();

		/////////////////////////////////

    	const trainingData = DataBuddy.createDistanceTrainingData( 1000 * 17, sorted );
    	const testingData  = DataBuddy.createDistanceTrainingData( 1000 *  3, sorted );

		/////////////////////////////////

	  	const inputs = tf.tensor2d( trainingData.inputs );
		const labels = tf.tensor2d( trainingData.labels.map( v=>[v] ) );

		await model.fit( inputs, labels, {
			epochs: epochs
			, batchSize: batchSize 
			, callbacks: {
				  onEpochEnd: (epoch, log) => console.log(`Epoch ${epoch}: loss = ${log.loss}`)
				, onTrainEnd: (tmi) => console.log( 'Trained!', tmi )
			}
		} );

		DataBuddy.printLine();
		console.log( 'model after training' );
		model.summary();
		DataBuddy.printLine();

		/////////////////////////////////

	  	const testInputs = tf.tensor2d( testingData.inputs );
		const testLabels = tf.tensor2d( testingData.labels.map( v=>[v] ) );
		const xox = model.evaluate( testInputs, testLabels, 11 );

		/////////////////////////////////

		DataBuddy.printLine();
		console.log( 'from model.evaluate:' );
		console.log( 'hi:', xox[0].arraySync() );
		console.log( 'ho:', xox[1].arraySync() );
		DataBuddy.printLine();

		/////////////////////////////////

		const expected   = Math.sqrt( 3 * .3 * .3 );
		const prediction = model.predict(tf.tensor2d([[.3,.3,.3]])).dataSync()[ 0 ];

		console.log( 
			  'expected:' + expected
			, ', prediction:' + prediction
			, ', e2:' + Math.pow( expected - prediction, 2 ) 
		);

		/////////////////////////////////

		const glsl = ['float nn_length( vec3 p ) {'];
		const lol = ['\tvec3 layer0 = p;'];

		model.weights.forEach( (weight,i) => {
			const name  = ( (i%2) ? 'bias' : 'weight' ) + Math.floor(i/2);
			const shape = weight.shape.join( 'x' );
			const data  = weight.read().dataSync();
			const type  = SHAPE_TO_TYPE[ shape ] || `idk_${shape}`;
			const value = ( SHAPE_TO_VALUE[ shape ] || ((d)=>d) )( data );
			glsl.push( `\t${type} ${name} = ${value};` );
			if ( i % 2 ) {
				const n = Math.floor(i/2);
				if( 'float' == type ) {
					lol.push( `\t${type} layer${n+1} = relu( dot( layer${n} , weight${n} ) + bias${n} );` );
				} else {
					lol.push( `\t${type} layer${n+1} = relu( layer${n} * weight${n} + bias${n} );` );
				}
			}
		});
		glsl.push( '', ...lol, `\treturn layer${model.weights.length / 2};`, '}' );

		DataBuddy.printLine();
		console.log( `\n${glsl.join('\n')}` );
		DataBuddy.printLine();
	}
};

new DistanceTf().main( process.argv.slice( 2 ) );
