#!/usr/bin/env node 

const nj = require('../../src/util/njeez');
const ToyNN = require( '../../src/nn/ToyNN' );
const DataBuddy = require('../../src/util/DataBuddy');

test('toynn-column0',()=> {
	const traskColumn0 = new ToyNN( 3, 1 );

    const trainingData = DataBuddy.createColumn0TrainingData();
    const trainingResult = traskColumn0.train( trainingData );
    console.log( trainingResult.selection.data.map( Math.round ).join( ' ' ) );

    const validationData = DataBuddy.createColumn0TrainingData();
    const validation = traskColumn0.predict( validationData.inputs );

	const simplified = validation.selection.data.map( Math.round );
    console.log( simplified.join( ' ' ) );

	simplified.forEach( (label,i) => {
		if ( i % 2 ) {
			expect( label ).toBeGreaterThan( .99 );
		} else {
       		expect( label ).toBeLessThan(.01);
		}
	});
});

test('toynn-xor',()=> {
	const traskXor = new ToyNN( 3, 4, 1 );

    const trainingData = DataBuddy.createXorTrainingData();
    const trainingResult = traskXor.train( trainingData );
    console.log( trainingResult.selection.data.map( Math.round ).join( ' ' ) );

    const validationData = DataBuddy.createXorTrainingData();
    const validation = traskXor.predict( validationData.inputs );

	const simplified = validation.selection.data.map( Math.round );
    console.log( simplified.join( ' ' ) );

	simplified.forEach( (label,i) => {
		const data = validationData.inputs[ i ];
		if ( 1 == data[ 0 ] +  data[ 1 ] ) {
			expect( label ).toBeGreaterThan( .99 );
		} else {
       		expect( label ).toBeLessThan(.01);
		}
	});
});

test('toynn-distance',()=> {
	const toyDistance = new ToyNN( 3, 6, 1 );

	const trainingData = DataBuddy.createDistanceTrainingData( 1000 );
	const trainingResult = toyDistance.train( trainingData, 1000 * 100 );

	const validationData = DataBuddy.createDistanceTrainingData( 1000 );
	const validation = toyDistance.predict( validationData.inputs );

	console.log( 
		'training   variance is', DataBuddy.variance( trainingResult.selection.data, trainingData.labels ) 
		+ '\n' +
		'validation variance is', DataBuddy.variance( validation.selection.data, validationData.labels ) 
	);
});

