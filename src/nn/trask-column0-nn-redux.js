#!/usr/bin/env node 

const nj = require('../util/njeez');
const tougher = !true;

const nonlin = (x,deriv=false) => {
	if ( nj.isArray( x ) ) return nj.lamda( x, v => nonlin( v,deriv ) );

	return deriv ? x * ( 1 - x ) : 1 / ( 1 + Math.exp( -x ) ); // sigmoid

	// more like relu for fun
	return (
		deriv
		? x < 0 || x > 1 ? 0 : 1 
		: Math.min( 1, Math.max( 0, x ) ) 
	);
};

// create test / training data where every other row has 
// the first column 0 or 1 and the rest random with expected
// being the value of the first columnt
const createData = ( count = 100 ) => {
	const input = new Array( count )
		.fill( 0 )
		.map( 
			(r,i) => new Array( 3 ).fill( 0 ).map( (_,j) => {
				if ( j ) return Math.random();
				const o = i % 2;
				if ( !tougher ) return o;
				// bit too tough for this network I guess. gets from 
				// 80 = 90% accuracy using sigmoid and 100x training set
				const d = .4 * Math.random();
				const v = o ? ( o - d ) : ( o + d );
				return v;
			})
		)
	;
	return { input:input, labels:[input.map(r=>Math.round(r[0]))]};
};

const predict = ( input, weights0 ) => {
	return nonlin( nj.dot( input, weights0 ) );
};

const train = ( input, labels, weights0 ) => {
	const layer0 = input;
	const layer1 = predict( layer0, weights0 );

	const error1 = nj.subtract( labels, layer1 );
	const error1Scale = nonlin( layer1, true );
	const scaledError1 = nj.multiply( error1, error1Scale );
	const update1 = nj.dot( layer0.T, scaledError1 );

	weights0 = nj.add( weights0, update1 );
	weights0.error = nj.dot( error1.T, error1 ).selection.data[ 0 ];

	return weights0;
};

const trask_2_layer_nn_redux = ( data = createData( tougher ? 1000 : 10 ) ) => {
	const input = nj.array( data.input );
	const labels = nj.array( data.labels ).T;	
	const threshold = 0.001;

	let weights0 = nj.random( input.shape[1], 1 ).multiply( 2 ).subtract( 1 );

	for ( let i = 0 ; i < 10 * 1000 ; i++ ) {
		weights0 = train( input, labels, weights0 );
		if ( weights0.error < threshold ) {
			console.log( 'error', weights0.error, 'at', i, 'is under threshold', threshold );
			break;
		}
		if ( 0 == i % 1000 ) {
			console.log( 'error', weights0.error, 'at', i );
		}
	}

	console.log( 'weights0', weights0.selection.data );
 
	console.log( "Output After Training:" );
	const output = nj.flatten( predict( nj.array( data.input ), weights0 ) ).map( v => Math.round(v) );
	console.log( output );

	const validate = createData();
	const predictions = predict( nj.array( validate.input ), weights0 );
	const matched = nj.flatten( predictions )
		.map(v=>Math.round(v))
		.reduce( (s,v,i) => s + ( v  == validate.labels[ 0 ][ i ] ? 1 : 0 ), 0 )
	;
	const accuracy = matched / validate.input.length;
	console.log( 'Accuracy:', matched, '/', validate.input.length, '=', accuracy );

    return output;
};

module.exports = trask_2_layer_nn_redux;
