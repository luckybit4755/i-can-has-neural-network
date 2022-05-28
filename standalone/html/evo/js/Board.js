class Board {
	static OFFSETS = [ [-1, -0], [+1, -0], [-1, +1], [-0, +1], [+1, +1], [-1, -1], [-0, -1], [+1, -1] ];

	/////////////////////////////////////////////////////////////////////////////

	constructor( nubs = null, size = 128 ) {
		this.reset( nubs, size );
	}

	/////////////////////////////////////////////////////////////////////////////

	reset( nubs = null, size = 128 ) {
		this.nubs = nubs;
		this.size = size;
		this.board = new Array( this.size ).fill( this.size ).map( _=> new Array( this.size ).fill( false ) );

		if ( null == nubs ) return this;

		this.nubs.forEach( nub=> {
			while( true ) {
				const r = Math.floor( Math.random() * this.size );
				const c = Math.floor( Math.random() * this.size );
				if ( !this.board[ r ][ c ] ) {
					nub.position = [ r, c ];
					this.set( nub.position, nub );
					break;
				}
			}
		});
		
		return this;
	}

	/////////////////////////////////////////////////////////////////////////////

	set( position, value ) {
		this.board[ position[ 0 ] ][position[ 1 ] ] = value;
	}

	get( position ) {
		return this.board[ position[ 0 ] ][ position[ 1 ] ];
	}

	/////////////////////////////////////////////////////////////////////////////

	occupied( position, offset = null ) {
		position = this.addOffset( position, offset );
		// consider out of bounds to be occupied
		if ( !this.inBounds( position ) ) return true;
		return this.get( position );
	}

	inBounds( position ) {
		const r = position[ 0 ];
		const c = position[ 1 ];
		return !( r < 0 || c < 0 || c >= this.size || r >= this.size );
	}

	move( oldPosition, newPosition, value ) {
		this.set( oldPosition, null );
		this.set( newPosition, value );
		return newPosition();
    }

	moveBy( oldPosition, offset, value ) {
		this.set( oldPosition, null );
		const newPosition = this.addOffset( oldPosition, offset );
		this.set( newPosition, value );
		return newPosition;
    }

	/////////////////////////////////////////////////////////////////////////////

	addOffset( position, offset = null ) {
		return (
			offset
			? ( Number.isInteger( offset ) 
				? this.addOffsetIndex( position, Board.OFFSETS[ offset ] )
				: this.addOffsetVector( position, offset )
			)
			: position
		);
	}

	addOffsetVector( position, offset ) {
		return Util.arrayAdd( position, offset );
	}

	addOffsetIndex( position, offset ) {
		if ( offset < 0 || offset >= board.OFFSETS ) {
			throw new Error( `offset ${offset} is out of bounds vs ${Board.OFFSETS}` );
		}
		return this.addOffsetVector( position, Board.OFFSETS[ offset ] );
	}

	/////////////////////////////////////////////////////////////////////////////
}
