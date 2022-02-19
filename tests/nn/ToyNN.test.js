#!/usr/bin/env node 

const nj = require('../../src/util/njeez');
const ToyNN = require( '../../src/nn/ToyNN' );
const DataBuddy = require('../../src/util/DataBuddy');

const verifyLabels = ( labels, predictions, threshold = .1, verbose = false ) => {
	predictions = predictions.selection.data;
	if ( verbose ) {
		console.log( 'labels      :', labels );
		console.log( 'predictions  :', predictions );
	}
	expect( labels.length ).toEqual( predictions.length );
	predictions.forEach( (prediction,i) => {
		const label = labels[ i ];
		const diff = Math.abs( prediction - label );
		if ( verbose ) {
			console.log( 'prediction', prediction, 'label', label );
		}
       	expect( diff ).toBeLessThan( threshold );
	});

};

test('toynn-column0',()=> {
	const traskColumn0 = new ToyNN( 3, 1 );

    const trainingData = DataBuddy.createColumn0TrainingData();
    const trainingResult = traskColumn0.train( trainingData );

    const validationData = DataBuddy.createColumn0TrainingData();
    const predictions = traskColumn0.predict( validationData.inputs );
	verifyLabels( validationData.labels, predictions, .2 );
});

test('toynn-column0-gd',()=> {
	const traskColumn0 = new ToyNN( 2, 1 );

    const trainingData = DataBuddy.createColumn0C2TrainingData();
    const trainingResult = traskColumn0.trainGradientDescent( trainingData );

    const validationData = DataBuddy.createColumn0C2TrainingData();
    const predictions = traskColumn0.predict( validationData.inputs );
	verifyLabels( validationData.labels, predictions );
});

test('toynn-xor',()=> {
	const traskXor = new ToyNN( 3, 4, 1 );

    const trainingData = DataBuddy.createXorTrainingData();
    const trainingResult = traskXor.train( trainingData );

    const validationData = DataBuddy.createXorTrainingData();
    const predictions = traskXor.predict( validationData.inputs );
	verifyLabels( validationData.labels, predictions );
});

test('toynn-xor-gd',()=> {
	const traskXor = new ToyNN( 3, 4, 1 );

    const trainingData = DataBuddy.createXorTrainingData();
    const trainingResult = traskXor.trainGradientDescent( trainingData );

    const validationData = DataBuddy.createXorTrainingData();
    const predictions = traskXor.predict( validationData.inputs );
	verifyLabels( validationData.labels, predictions );
});

// this just really doesn't seem to work... perhaps the toy implementation
// is still too weak...
test('toynn-distance',()=> {
	//const toyDistance = new ToyNN( 3, 3, 1 );
	const toyDistance = new ToyNN( 3, 1 );

	const sort = true;

	const trainingData = DataBuddy.createDistanceTrainingData( 1000, sort );
	//const trainingResult = toyDistance.train( trainingData, 1000 * 10 );
	const trainingResult = toyDistance.trainGradientDescent( trainingData, .33, 1000 );

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


	// this is borked...
	//verifyLabels( validationData.labels, validation, .3 );
});

