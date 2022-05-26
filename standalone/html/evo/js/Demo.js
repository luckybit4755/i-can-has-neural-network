/**
 *
 * Mostly handles ui junk
 *
 */ 
class Demo {
	run() {
		this.evo = new Evo();
		this.controller();
		this.evo.canvas.addEventListener( 'click', () => this.evo.placeNubs() );
	}

	controller() {
		this.controls = this.controls();

		const button = this.controls.get( 'evo' )();
		button.addEventListener( 'click', () => {
			try { 
				this.click()
			} catch ( e ) {
				console.log( e );
				// TODO: warn the user...
			}
		});
		button.click();

		const recordCanvas = new RecordCanvas( this.evo.canvas );

		const record = this.controls.get( 'record' )();
		record.addEventListener( 'click', () => {
			if ( record.recording ) {
				recordCanvas.stop();
				record.recording = false;
				record.textContent = 'record video';
			} else {
				recordCanvas.start();
				record.recording = true;
				record.textContent = 'stop recording';
			}
		});
	} 

	click() {
		const errors = [];

		// parsing and validation
		const values = new Map();
		for ( const [key,get] of this.controls ) {
			let value = get();
			switch ( key ) {
				case 'record': 
				case 'evo': break;
				case 'hidden':
					const hidden = value
						.replace( /[^0-9]+/g, ' ' ).replace( /\s\s*/, ' ' ).trim()
						.split( ' ' ).map( v => parseInt( v.trim() ) );
					if ( hidden.length != hidden.filter( n=> n === parseInt( n ) ).length ) {
						errors.push( `hidden must be a off integers, not ${tmp}` );
						continue;
					}
					value = hidden;
					break;
				default:
					const i = parseInt( value );
					if ( isNaN( i ) ) {
						errors.push( `${key} is not a number: ${value}` );
					} else {
						value = i;
					}
			}
			values.set( key, value );
		}

		if ( errors.length ) {
			throw new Error( errors.join( '\n' ) );
		}

		this.evo.configure(
			values.get( 'hidden' ),
			values.get( 'size' ),
			values.get( 'nubCount' ),
			values.get( 'generation' ),
			values.get( 'mechanism' ),
			values.get( 'iterationsPerFrame' )
		);
		this.evo.run();
	}

	controls() {
		const controls = new Map();
		'button input select'.split( ' ' ).forEach( tag => {
			Array.from( 
				document.getElementsByTagName( tag ) 
			).forEach( element => {
				let get = () => element.value;
				switch( tag ) {
					case 'button': get = () => element; break;
					case 'select': get = ( element.hasAttribute( 'useIndex' )
						? () => element.selectedIndex
						: () => element.options[ element.selectedIndex ].text
					);
					break;
				}
				controls.set( element.name, get );
			})
		});
		return controls;
	}
};
