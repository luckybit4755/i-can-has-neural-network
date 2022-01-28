#!/usr/bin/env node 

const trask_2_layer_nn = require( '../../src/nn/trask-column0-nn' );

test('trask-2-layer-nn',()=> {
    const data = trask_2_layer_nn();
	expect( data[ 0 ] ).toBeLessThan(.01);
	expect( data[ 1 ] ).toBeLessThan(.01);
	expect( data[ 2 ] ).toBeGreaterThan(.99);
	expect( data[ 3 ] ).toBeGreaterThan(.99);
});

