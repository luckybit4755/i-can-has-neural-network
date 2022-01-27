const nj = require('numjs');
/*
const closure = ( x, cb ) => {
    const y = x.clone();
    y.selection.data = y.selection.data.map( (v,i) => cb( v, i, y ) );
    return y
};
*/

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

const decorate = ( n ) => {
	n.lamda = ( lamda ) => {
		const y = n.clone();
		y.selection.data = y.selection.data.map( (v,i) => lamda( v, i, y ) );
		return y
	};
	//n.dot = n.dot || ( ( o ) => nj.dot( n, o ) );
	return n;
};

const njeez = {
	array: (a,b,c,d,e) => decorate( nj.array(a,b,c,d,e) ),
	dot: (a,b) => decorate( nj.dot(a,b) ),
	d: decorate,
	decorate: decorate,
	random: function() {
		const q = arguments;
		let n = null;
		switch( arguments.length ) {
			case 0: n = nj.random(); break;
			case 1: n = nj.random(q[0]); break;
			case 2: n = nj.random(q[0],q[1]); break;
			case 3: n = nj.random(q[0],q[1],q[2]); break;
			case 4: n = nj.random(q[0],q[1],q[2],q[3]); break;
			case 5: n = nj.random(q[0],q[1],q[2],q[3],q[4]); break;
			default: throw 'sorry, too lazy... use njeez.decorate(njeez.nj.random)'
		}
		return decorate( n );
	},
	toArray: toArray,
	//closure: closure,
	isArray: isArray,
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
