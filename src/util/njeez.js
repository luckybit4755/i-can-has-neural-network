const nj = require('numjs');
const sprintf = require('sprintf-js').sprintf;

const isArray = ( x ) => 'object' === typeof( x ) && 'selection' in x;

const toArray = ( n, shape = null, stride = null, data_offset = 0, shape_offset = 0, stride_offset = 0 ) => {
	if ( null === shape ) {
		return toArray( n.selection.data, n.shape, n.selection.stride, data_offset, shape_offset, stride_offset );
	}

	const size = shape[ shape_offset ];
	const strd = stride[ stride_offset ];

	if ( shape_offset === shape.length - 1 ) {
		return new Array( size ).fill( 0 ).map( (v,i) => n[ data_offset + strd * i ] );
	}

	return new Array( size ).fill( 0 ).map( 
		(v,i) => {
			const a = toArray( n, shape, stride, data_offset, shape_offset + 1, stride_offset +1 )
			data_offset += strd;
			return a;
		}
	);
};

const lamda = ( n, cb ) => {
	const y = n.clone();
	y.selection.data = y.selection.data.map( (v,i) => cb( v, i, y ) );
	return y
};

const toFlatString = ( a ) => {
	return a.selection.data
		.map( v => sprintf( '%+8.4f', v ) )
		.join( ', ' )
	;
}

const njeez = {
	lamda: lamda,
	isArray: isArray,
	toArray: toArray,
	flatten: (n)=>n.selection.data,
	toFlatString: toFlatString
};

Object.keys( nj ).forEach( key => {
	if ( key in njeez ) {
		//console.log('got', key );
	} else {
		njeez[ key ] = nj[ key ];
		//console.log('gimme', key );
	}
});

module.exports = njeez;
