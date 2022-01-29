#!/usr/bin/env node 

const ToyNN = require( '../../src/nn/ToyNN' );

test('toynn-column0',()=> {
	const traskColumn0 = new ToyNN( 3, 1 );

    const trainingData = ToyNN.createDataColumn0();
    const trainingResult = traskColumn0.train( trainingData );
    console.log( trainingResult.selection.data.map( Math.round ).join( ' ' ) );

    const validationData = ToyNN.createDataColumn0();
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
