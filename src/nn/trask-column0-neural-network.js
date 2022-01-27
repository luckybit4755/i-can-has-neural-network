#!/usr/bin/env node 

const nj = require('../util/njeez');

// sigmoid function
const nonlin = (x,deriv=false) => {
	if ( nj.isArray( x ) ) return nj.lamda( x, v => nonlin( v,deriv ) );
	return deriv ? x*(1-x) : 1/(1+Math.exp(-x));
}

const trask_2_layer_neural_network = () => {
	// input dataset
	const X = nj.array([  [0,0,1],
		[0,1,1],
		[1,0,1],
		[1,1,1] ]);

	// output dataset           
	y = nj.array([[0,0,1,1]]).T;
 
	// seed random numbers to make calculation
	// deterministic (just a good practice)
	// lol nj.random.seed(1);
 
	// initialize weights randomly with mean 0
	let syn0 = nj.random( 3, 1 ).multiply( 2 ).subtract( 1 );

	let l1;
	for ( let iter = 0 ; iter < 10000 ; iter++ ) {
 
    	// forward propagation
		let l0 = X
		l1 = nonlin(nj.dot(l0,syn0));
     
    	// how much did we miss?
    	l1_error = y.subtract( l1 ); // y - l1
     
    	// multiply how much we missed by the
    	// slope of the sigmoid at the values in l1
    	l1_delta = l1_error.multiply( nonlin(l1,true) );
     
    	// update weights
    	//syn0 += nj.dot(l0.T,l1_delta)
		syn0 = syn0.add( nj.dot(l0.T,l1_delta) );
	}
 
	console.log( "Output After Training:" );
	console.log( l1.selection.data );
    console.log( nonlin( nj.dot( nj.array([
        [0,.1,.1],
        [0,.1,.5],
        [0,.5,.1],
        [0,.9,.1],
        [0,.1,.9],
        [0,.9,.9],
    ]), syn0 ) ).selection.data );

    return l1.selection.data;
};

module.exports = trask_2_layer_neural_network;
trask_2_layer_neural_network();
