class Util {
	static OFFSETS = [ [-1, -0], [+1, -0], [-1, +1], [-0, +1], [+1, +1], [-1, -1], [-0, -1], [+1, -1] ];
	
	static r1() {
		return 2 * ( Math.random() - Math.random() );
	}

	static randomArray() {
		switch ( arguments.length ) {
			case 1: return new Float32Array( arguments[ 0 ] ).fill( 0 ).map( _=> Util.r1() );
			case 2: return new Array( arguments[ 0 ] ).fill( 0 ).map( _=> 
				new Float32Array( arguments[ 1 ] ).fill( 0 ).map( _=> Util.r1() )
			)
		}
		throw new Error( `unsupported array dimension: ${arguments.length}` );
	}

	// copies the shap but replace with random values
	// useful for non-rectangular arrays (like layers)
	static randomDupe( layers ) {
		return layers.map( layer => Util.randomArray( layer.length ) );
	}

	static arrayAdd(a,b) {
	   return a.map( (v,i)=>v+b[i]);
	}

	// convert [0:1] to [-1:+1];
	static toPM( v ) {
		return 2 * v - 1;
	}

	// convert [-1:+1] to [0:1]
	static toOne( v ) {
		return Math.max( 0, Math.min( 1, .5 * v + 1 ) );
	}

	static pmMinMax( a ) {
		a.forEach( (v,i) => a[ i ] = Math.round( Math.max( -1, Math.min( 1, v ) ) ) );
		return a;
	}
	static pmTanh( a ) {
		a.forEach( (v,i) => a[ i ] = Math.round( Math.tanh( v ) ) );
		return a;
	}

	static copyKeys( keys, source, target = {} ) {
		keys = ( 'string' === typeof( keys ) ) ? keys.split( ' ' ) : keys;
		keys.forEach( key => target[ key ] = source[ key ] );
		return target;
	}

	static padLeft( s, l = 3, c = '0' ) {
        while ( s.length < l ) s = `${c}${s}`;
		return s;
	}
}
