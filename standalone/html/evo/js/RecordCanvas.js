// adapted from https://github.com/webrtc/samples/blob/gh-pages/src/content/capture/canvas-record/js/main.js
class RecordCanvas {
	constructor( canvas = document.getElementsByTagName( 'canvas' )[ 0 ], video = null ) {
		this.canvas = canvas;
		this.video = video || this.createVideo();
		this.mediaSource = new MediaSource();
	}

	createVideo() {
		const video = document.createElement( 'video' );
		video.style.display = 'none';
		document.body.appendChild( video );
		return video;
	}

	start() {
		const data = [];
		const stream = this.canvas.captureStream();

		this.mediaRecorder = null;
		
		const errors = [];
		let type = null;
		'video/mp4 video/webm video/webm,codecs=vp9 video/vp8'.split( ' ' ).forEach( t => {
			if ( this.mediaRecorder ) return;

			type = t;
			try {
				this.mediaRecorder = new MediaRecorder( stream, {mimeType:type} );
				console.log( `using ${type}` );
				this.extension = type.replace( /,.*/, '' ).replace( /\/.*/, '' );
			} catch ( e ) {
				errors.push( e );
			}
		});
		if ( !this.mediaRecorder ) {
			throw new Error( 'oops:' + errors.join( '\n' ) );
		}


		this.mediaRecorder.addEventListener( 'stop', ( event ) => {
			this.download( new Blob( data, {type:type} ) );
		});

		this.mediaRecorder.addEventListener( 'dataavailable', (event) => {
			if (event.data && event.data.size > 0) {
				data.push( event.data );
			}
		});

		this.mediaRecorder.start();
	}

	stop() {
		this.mediaRecorder.stop();
	}

	download( blob ) {
		const url = window.URL.createObjectURL( blob );

		const a = document.createElement( 'a' );
		a.style.display = 'none';
		a.href = url;
		a.download = `nub-${ new Date().getTime() }.${ this.extension }`;
		document.body.appendChild( a );

		a.click();
		setTimeout(() => {
			document.body.removeChild( a );
			window.URL.revokeObjectURL( url );
		}, 100);
	}
}
