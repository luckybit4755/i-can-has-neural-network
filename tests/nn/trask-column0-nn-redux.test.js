#!/usr/bin/env node 

const trask_2_layer_nn_redux = require( '../../src/nn/trask-column0-nn-redux' );

test('trask-2-layer-nn-redux',()=> {
	const data = {
		input:[
			[0,0,1],
			[0,1,1],
			[1,0,1],
			[1,1,1] 
		],
		labels:[[0,0,1,1]]
	}
    const output = trask_2_layer_nn_redux( data );
	expect( output[ 0 ] ).toBeLessThan(.01);
	expect( output[ 1 ] ).toBeLessThan(.01);
	expect( output[ 2 ] ).toBeGreaterThan(.99);
	expect( output[ 3 ] ).toBeGreaterThan(.99);
});

