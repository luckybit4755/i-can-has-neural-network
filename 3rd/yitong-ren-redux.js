#!/usr/bin/env node 

// adapted from https://towardsdatascience.com/a-step-by-step-implementation-of-gradient-descent-and-backpropagation-d58bda486110
const nj = require('numjs');
class NeuralNetwork {
	constructor() {
        // nj.random.seed(10) // for generating the same results
        this.weights = [
        	  nj.random(3,4) // input to hidden layer weights
        	, nj.random(4,1) // hidden layer to output weights
		];
	}

    sigmoid( z ) {
		if ( !isNaN( z ) ) {
			return 1 / (1 + Math.exp(-z) );
		}
		const a = z.selection.data;
		a.forEach( (v,i) => a[i] = this.sigmoid( v ) );
		return z;
	}

    sigmoid_derivative(z) {
		if ( !isNaN( z ) ) {
			const q = this.sigmoid(z) 
			return q * ( 1 - q );
		}

		const a = z.selection.data;
		a.forEach( (v,i) => a[ i ] = this.sigmoid_derivative( v ) );
		return z;
	}

	print( message, a ) {
		console.log( message + '\n' + JSON.parse( a.toJSON() ).map(r=>`\t[${r.join(', ')}]`).join('\n')  );
	}
    
    gradient_descent( x, y, iterations ) {
        const lastWeightIndex = this.weights.length - 1;
		let result = null;

		for ( let t = 0 ; t < iterations ; t++ ) {
            //////////////////////////////////////////////////////////////////////////////
            // forward propagation

			const layers = new Array( this.weights.length + 1 );
			for ( let i = 0 ; i < layers.length ; i++ ) {
				const j = i - 1;
				result = layers[ i ] = i ? this.sigmoid( nj.dot( layers[j], this.weights[j] ) ) : x;
			}

            //////////////////////////////////////////////////////////////////////////////
            // back propagation

            const gradients = new Array( this.weights.length );
			const delta = new Array( this.weights.length );

			for ( let i = lastWeightIndex ; i > -1 ; i-- ) {
                const slope = this.sigmoid_derivative( nj.dot( layers[i], this.weights[i] ) );
				const error = ( i == lastWeightIndex
					? nj.subtract( y , layers[i+1] )
                    : nj.dot(delta[i+1], this.weights[i+1].T)
				);

                delta[i] = nj.multiply( error , slope );
                gradients[i] = nj.dot( layers[i].T, delta[i] );
			}

            // update weights
			for ( let i = 0 ; i <= lastWeightIndex ; i++ ) {
                this.weights[i] = nj.add( this.weights[i], gradients[i] )
			}
		}

		this.print( 'The final prediction from neural network are:', result );
	}
}

const main = () => {
    const neural_network = new NeuralNetwork()
	neural_network.print( 
    	'Random starting input to hidden weights: ',
    	neural_network.weights[0]
	)
	neural_network.print( 
    	'Random starting hidden to output weights: ',
    	neural_network.weights[1]
	);

    X = nj.array([[0, 0, 1], [1, 1, 1], [1, 0, 1], [0, 1, 1]])
    y = nj.array([[0, 1, 1, 0]]).T
    neural_network.gradient_descent(X, y, 10000)
}

main();
