class Util {
	static OFFSETS = [ [-1, -0], [+1, -0], [-1, +1], [-0, +1], [+1, +1], [-1, -1], [-0, -1], [+1, -1] ];
	
	static r1() {
		return 2 * ( Math.random() - Math.random() );
	}

	static arrayAdd(a,b) {
	   return a.map( (v,i)=>v+b[i]);
	}

	// convert [0:1] to [-1:+1];
	static toPM( v ) {
		return 2 * v - 1;
	}

	static randomArray() {
		switch ( arguments.length ) {
			case 1: return new Array( arguments[ 0 ] ).fill( 0 ).map( _=> Util.r1() );
			case 2: return new Array( arguments[ 0 ] ).fill( 0 ).map( _=> 
				new Array( arguments[ 1 ] ).fill( 0 ).map( _=> Util.r1() )
			)
		}
		throw new Error( `unsupported array dimension: ${arguments.length}` );
	}

	// copies the shap but replace with random values
	// useful for non-rectangular arrays (like layers)
	static randomDupe( layers ) {
		return layers.map( layer => Util.randomArray( layer.length ) );
	}

	static copyKeys( keys, source, target = {} ) {
		keys = ( 'string' === typeof( keys ) ) ? keys.split( ' ' ) : keys;
		keys.forEach( key => target[ key ] = source[ key ] );
		return target;
	}
};
