/** 
 *
 * Handles drawing
 *
 */
class Drawing {

	/////////////////////////////////////////////////////////////////////////////

	static WHITE_A    = 'rgba(255,255,255,.93)';
	static GREY_A     = 'rgba(200,200,200,.93)';
	static GREY       = 'rgb(200,200,200)';
	static LIGHT_GREY = 'rgb(222,222,222)';

	static FONT       = '22px Comic-Sans';
	static SMALL_FONT = '12px Comic-Sans';

	/////////////////////////////////////////////////////////////////////////////

	constructor( canvas = null ) {
		this.canvas = canvas || document.getElementsByTagName( 'canvas' )[ 0 ];
		this.context = this.canvas.getContext( '2d' );
		this.context.font = Drawing.FONT;

		this.w = parseInt( this.canvas.width );
		this.h = parseInt( this.canvas.height );
	}

	/////////////////////////////////////////////////////////////////////////////

	// override this:
	drawMechanism() {}

	// implement this to use debugMechanism
	survivedXY( x, y ){};

	/////////////////////////////////////////////////////////////////////////////

	clear( color = Drawing.WHITE_A ) {
		this.context.fillStyle = color;
		this.fillRect();
	}

	drawGraph( counts, done = false, w = 10, color = 'green', lineWidth = 3, font = Drawing.SMALL_FONT ) {
		this.context.lineWidth = lineWidth;
		this.context.strokeStyle = color;

		// make sure it fits on the screen...

		if ( done ) {
			w = this.w / counts.length;
		} else {
			counts = counts.length * w > this.w 
				? counts.slice( -this.w / w + 1 )
				: counts;
		}

		// draw the line graph

		this.context.beginPath();
		counts.forEach( (v,x)=> {
			const y = this.graphY( v );
			x *= w;
			x ? this.context.lineTo( x,y ) : this.context.moveTo( x,y );
		});
		this.context.stroke()

		// label latest min / max values

		let min = 110, minX = -1;
		let max = -99, maxX = -1;

		counts.forEach( (v,x)=> {
			if ( v <= min ) {
				min = v;
				minX = x;
			}
			if ( v >= max ) {
				max = v;
				maxX = x;
			}
		});
		//console.log( `min ${min} at ${minX} ; max ${max} at ${maxX}` );

		if ( min == max ) return; // too boring and looks dumb

		const o = w * 1;
		const oldFont = this.context.font;
		this.context.font = font;
		this.context.fillStyle = color;
		this.fillText( `${min}%`, minX * w + 0, this.graphY( min ) + o );
		this.fillText( `${max}%`, maxX * w + 0, this.graphY( max ) - o );
		this.context.font = oldFont;
	}

	graphY( v ) {
		return this.h - this.h * v / 100;
	}

	drawLegend( iteration, generation, counts, count, sarnathCounter ) {
		const x = 33;
		const y = 39;
		const toShow = 3;

		const g = Util.padLeft( '' + Math.floor( iteration / generation ), 3, ' ' );
		const i = Util.padLeft( '' + iteration % generation );
		const legend = `${g}.${i}${this.percentArray( counts, toShow )}`;

		this.context.fillStyle = Drawing.GREY_A;
		this.fillRect( x-6 , y-23, (3+1+3+1+1+toShow*4) * 15, 33 );

		this.context.fillStyle = 'black';
		this.fillText( legend, x, y );

		if ( sarnathCounter > -1 ) {
			this.context.fillStyle = 'red';
			const last = counts[ counts.length - 1 ];
			const sarnath = `${last} of ${count} survived`;
			this.fillText( sarnath, this.w * .30, this.h * .88 );
		}
	}

	percentArray( counts, toShow = 3 ) {
		return counts.length
			? `: ${counts.slice(-toShow).map( p=>`${p}%`).join( ', ' )}`
			: '';
	}

	drawNubs( nubs ) {
		nubs.forEach( nub=> this.drawNub( nub ) );
	}

	drawNub( nub ) {
		const r = nub.position[ 0 ];
		const c = nub.position[ 1 ];
		const x = c * this.scale;
		const y = r * this.scale;

		const p = this.paused > 0;

		const s = p ? this.scale * .499 : this.scale;

		this.context.strokeStyle = this.context.fillStyle = nub.dead 
			? ( Util.r1() < 0 ? Drawing.GREY : Drawing.LIGHT_GREY )
			: nub.color;

		p > 0 ? this.fillArc( x, y, s ) : this.fillRect( x, y, s, s );
	}

	fillText( text, x, y ) {
		this.context.fillText( text, x, y );
	}

	fillRect( x = 0, y = 0, w = this.w, h = this.h ) {
		this.context.fillRect( x, y, w, h);
	}

	fillArc( x = 0, y = 0, r = 5, s=0, e = 2 * Math.PI) {
		this.context.beginPath();
		this.context.arc( x,y,r,s,e );
		this.context.closePath();
		this.context.fill();
		this.context.stroke();
	}

	line( x0, y0, x1, y1 ) {
		this.context.beginPath();
		this.context.moveTo( x0, y0 );
		this.context.lineTo( x1, y1 );
		this.context.closePath();
		this.context.stroke();
	}

	drawFinalState( nubs, counts, iteration, generation, sarnathCounter, done = false ) {
		this.clear( Drawing.WHITE_A );
		this.drawMechanism();
		this.drawNubs( nubs );
		this.drawGraph( counts, done );
		this.drawLegend( iteration, generation, counts, nubs.length, sarnathCounter );
	}

	// sometimes this is easier to create the drawMechanism for new ones
	debugMechanism() {
		const imageData = this.context.getImageData( 0, 0, this.w,this.h);
		let index = 0;
		for( let y = 0 ; y < this.h ; y++ ) {
			for( var x = 0 ; x < this.w ; x++ ) {
				const k = this.survivedXY( x, y );
				imageData.data[ index++ ] = 0;
				imageData.data[ index++ ] = 0;
				imageData.data[ index++ ] = 255;
				imageData.data[ index++ ] = k?255:0;
			}
		}
		this.context.putImageData( imageData, 0, 0 );
	}

	/////////////////////////////////////////////////////////////////////////////
	// miscellanous geometry

	insideCircle( x,y, cx,cy, radius ) {
		const xd = x - cx;
		const yd = y - cy;
		return ( xd * xd + yd * yd ) < ( radius * radius );
	}
};
