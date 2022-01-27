#!/usr/bin/env node 

const trask_2_layer_neural_network = require( '../../src/nn/trask-column0-neural-network' );

test('trask-2-layer-neural-network',()=> {
    const data = trask_2_layer_neural_network();
	expect( data[ 0 ] ).toBeLessThan(.01);
	expect( data[ 1 ] ).toBeLessThan(.01);
	expect( data[ 2 ] ).toBeGreaterThan(.99);
	expect( data[ 3 ] ).toBeGreaterThan(.99);
});

