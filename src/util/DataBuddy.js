
module.exports = 
class DataBuddy {
	static createColumn0TrainingData( count = 10 ) {
		const inputs = new Array( 10 ).fill( 0 ).map( 
			(r,i) => new Array( 3 ).fill( 0 ).map(
				(c,j) => j ? Math.random() : i % 2
			)
		);
		const labels = inputs.map( r => r[ 0 ] );
		return { inputs:inputs, labels:labels };
	}

	static createColumn0TrainingDataJr( count = 10 ) {
		const inputs = [[0,1], [0,1], [1,0], [1,0]];
		const labels = inputs.map( r => r[ 0 ] );
		return { inputs:inputs, labels:labels };
	}

	static createColumn0C2TrainingData( count = 10 ) {
		const inputs = [[0,1], [0,1], [1,0], [1,0]];
		const labels = inputs.map( r => r[ 0 ] );
		return { inputs:inputs, labels:labels };
	}

	static createXorTrainingData( count = 10 ) {
		return {
			inputs:[[0,0,1], [0,1,1], [1,0,1], [1,1,1]],
			labels: [0,1,1,0] // y  = np.array([[0], [1], [1], [0]])
		};
	}

	static createDistanceTrainingData( count = 10, sort = false ) {
		const trainingData = { inputs: new Array( count ), labels: new Array( count ) };
		for ( let i = 0 ; i < count ; i++ ) {
			const size = Math.random();
			let actual = 0;
			const v = new Array( 3 ).fill( 0 ).map( _=> Math.random() );
			trainingData.inputs[ i ] = sort ? v.sort( (a,b) => a-b ) : v;
			trainingData.labels[ i ] = size;
		}
		console.log( trainingData.inputs[ 0 ] );
		return trainingData;
	}

	static variance( actual, expected ) {
		let variance = 0;
		actual.forEach( (v,i) => {
			const e = expected[ i ];
			const d = Math.pow( v - e, 2 );
			variance += d;
		});
		return variance / ( 1 + expected.length );
	};
};
