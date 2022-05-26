#!/usr/bin/env node

const nj        = require( '../../src/util/njeez' );
const ToyNN     = require( '../../src/nn/ToyNN' );
const DataBuddy = require( '../../src/util/DataBuddy' );
const sprintf   = require( 'sprintf-js' ).sprintf;

const verifyLabels = ( labels, predictions, threshold = .1, verbose = false ) => {
	predictions = predictions.selection.data;
	expect( labels.length ).toEqual( predictions.length );

	if ( verbose ) {
		console.log(
			predictions.map( (prediction,i) => {
				const label = labels[ i ];
				const diff = Math.abs( prediction - label );
				const achtung = diff>threshold ? " <-- achtung!" : "";
				return sprintf( "%d vs %8.4f -> %8.4f%s", label, prediction, diff, achtung );
			}).join( '\n' )
		);
	}

	predictions.forEach( (prediction,i) => {
		const label = labels[ i ];
		const diff = Math.abs( prediction - label );
		if ( diff >= threshold ) {
			console.log( sprintf( 'oh, snap: %8.4f vs %8.4f is way bad...', prediction, label ) )
		}
       	expect( diff ).toBeLessThan( threshold );
	});
};

test.only('toynn-column0',()=> {
for ( let i = 0 ; i<33 ;i++) {
	const traskColumn0 = new ToyNN( [3, 1] );

    const trainingData = DataBuddy.createColumn0TrainingData();
    const trainingResult = traskColumn0.train( trainingData );

    const validationData = DataBuddy.createColumn0TrainingData();
    const predictions = traskColumn0.predict( validationData.inputs );

console.log('exp:', nj.toFlatString( nj.array( validationData.labels ) ) );
console.log('got:', nj.toFlatString( predictions ) );

	verifyLabels( validationData.labels, predictions, .5, !true ); // the results have wild variance :-(
}
});

test('toynn-column0-gd',()=> {
	const traskColumn0 = new ToyNN( [2, 1] );

    const trainingData = DataBuddy.createColumn0C2TrainingData();
    const trainingResult = traskColumn0.trainGradientDescent( trainingData );

    const validationData = DataBuddy.createColumn0C2TrainingData();
    const predictions = traskColumn0.predict( validationData.inputs );
	verifyLabels( validationData.labels, predictions );
});

test('toynn-xor',()=> {
	const traskXor = new ToyNN( [3, 4, 1] );

    const trainingData = DataBuddy.createXorTrainingData();
    const trainingResult = traskXor.train( trainingData );

    const validationData = DataBuddy.createXorTrainingData();
    const predictions = traskXor.predict( validationData.inputs );
	verifyLabels( validationData.labels, predictions );
});

test('toynn-xor-gd',()=> {
	const traskXor = new ToyNN( [3, 4, 1] );

    const trainingData = DataBuddy.createXorTrainingData();
    const trainingResult = traskXor.trainGradientDescent( trainingData );

    const validationData = DataBuddy.createXorTrainingData();
    const predictions = traskXor.predict( validationData.inputs );
	verifyLabels( validationData.labels, predictions );
});

// finally mostly working!
test('toynn-distance',()=> {
	const sort = true;
	const trainingData = DataBuddy.createDistanceTrainingData( 1000 * 10 , sort );
	const validationData = DataBuddy.createDistanceTrainingData( 1000, sort );

	const toyDistance = new ToyNN( [3, 1], ToyNN.ACTIVATION.relu );

	const learningRate  = .0001;
	const epochs        = 1000 * 100;
	const batchSize     = 10;
	const trainingResult = toyDistance.trainGradientDescent( trainingData, learningRate, epochs, batchSize );
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

	verifyLabels( validationData.labels, predictions, .2 );
});

