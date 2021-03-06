/**
 *
 * Managed Evo instances and handles the ui tasks.
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
		this.evoButton();
		this.skip();
		this.apotheosize();
		this.record();
	} 

	/////////////////////////////////////////////////////////////////////////////

	evoButton() {
		const button = this.controls.get( 'evo' )();
		button.addEventListener( 'click', () => {
			try { 
				this.disable( button );
				this.click()
				this.enable( button );
			} catch ( e ) {
				console.log( e );
				// TODO: warn the user...
			}
		});
		button.click();
	}

	click() {
		const values = this.getValues();


		this.evo.configure(
			  values.get( 'hidden' )
			, values.get( 'size' )
			, values.get( 'nubCount' )
			, values.get( 'generation' )
			, values.get( 'mechanism' )
			, values.get( 'iterationsPerFrame' )
			, values.get( 'maxSurvival' )
			, values.get( 'maxGenerations' )
			, values.get( 'mutationRate' ) / 1000
		);
		this.evo.run();
	}

	// parsing and validation
	getValues() {
		const errors = [];

		const values = new Map();
		for ( const [key,get] of this.controls ) {
			let value = get();

			// skip the buttons
			if ( 'object' === typeof( value ) ) {
				continue;
			}

			switch ( key ) {
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

		return values;
	}

	/////////////////////////////////////////////////////////////////////////////

	skip() {
		const skip = this.controls.get( 'skip' )();
		skip.addEventListener( 'click', () => { 
			this.disable( skip );
			this.evo.skip() 
			this.enable( skip );
		});
	}

	/////////////////////////////////////////////////////////////////////////////

	apotheosize() {
		const apotheosize = this.controls.get( 'apotheosize' )();
		apotheosize.addEventListener( 'click', () => {
			this.disable( apotheosize );
			this.evo.apotheosis();
			this.enable( apotheosize );
		});
	}

	/////////////////////////////////////////////////////////////////////////////

	record()  {
		const recordCanvas = new RecordCanvas( this.evo.canvas );
		const record = this.controls.get( 'record' )();
		record.addEventListener( 'click', () => {
			if ( record.recording ) {
				recordCanvas.stop();
				record.recording = false;
				record.textContent = 'record';
			} else {
				recordCanvas.start();
				record.recording = true;
				record.textContent = 'stop';
			}
		});
	}

	/////////////////////////////////////////////////////////////////////////////

	disable( e ) {
		e.setAttribute( 'disabled', 'x' );
	}

	enable( e ) {
		e.removeAttribute( 'disabled' );
	}
	
	/////////////////////////////////////////////////////////////////////////////

	controls() {
		const controls = new Map();
		const elements = new Map();

		'button input select'.split( ' ' ).forEach( tag => {
			Array.from( 
				document.getElementsByTagName( tag ) 
			).forEach( element => {
				const name = element.name;
				elements.set( name, element );

				let get = () => element.value;
				switch( tag ) {
					case 'button': get = () => element; break;
					case 'select': get = ( element.hasAttribute( 'useIndex' )
						? () => element.selectedIndex
						: () => element.options[ element.selectedIndex ].text
					);
					break;
				}
				if( 'range' === element.type ) {
					Array.from( document.getElementsByName( name ) ).forEach( ele => {
						if ( 'VALUE' === ele.tagName ) {
							element.addEventListener( 'input', (e)=> {
								ele.innerHTML = e.target.value / 10.00 + '%'
							});
							element.hack = ele;
						}
					});
				}


				controls.set( name, get );
			})
		});

		Array.from( document.getElementsByTagName( 'rc' ) ).forEach( rc => {
			const target = elements.get( rc.getAttribute( 'target' ) );
			const delta = parseInt( rc.getAttribute( 'delta' ) );
			const min = parseInt( parseInt( target.getAttribute( 'min' ) ) );
			const max = parseInt( parseInt( target.getAttribute( 'max' ) ) );

			rc.addEventListener( 'click', (e)=> {
				const nu = parseInt( target.value ) + delta;
				if ( nu >= min && nu <= max ) {
					target.value = nu;
					target.hack.innerHTML = target.value / 10.00 + '%'
				}
			});
		});

		return controls;
	}
};
