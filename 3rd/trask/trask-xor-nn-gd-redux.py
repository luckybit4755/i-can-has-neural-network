import numpy as np

alphas = [0.001,0.01,0.1,1,10,100,1000]
alphas = [10]

# compute sigmoid nonlinearity
def sigmoid(x):
    output = 1/(1+np.exp(-x))
    return output

# convert output of sigmoid function to its derivative
def sigmoid_output_to_derivative(output):
    return output*(1-output)
    
inputData = np.array([[0,0,1],
            [0,1,1],
            [1,0,1],
            [1,1,1]])
                
inputLabels = np.array([[0],
			[1],
			[1],
			[0]])

def newArray( n ):
    return [None] * n

layerSize = 3
weigthSize = layerSize - 1

for alpha in alphas:
    print ( "\nTraining With Alpha:" + str(alpha) )
    np.random.seed(1)

    # randomly initialize our weights with mean 0
    weights = newArray( weigthSize )
    weights[0] = 2*np.random.random((3,4)) - 1
    weights[1] = 2*np.random.random((4,1)) - 1

    for j in iter(range(60000)):

        ##########################################################################################
        # Feed forward through layers 0, 1, and 2
        layers = newArray( layerSize )
        for l in iter(range(len(layers))):
            if 0 == l:
                layers[ 0 ] = inputData
            else:
                layers[ l ] =  sigmoid(np.dot(layers[l-1],weights[l-1]))

        ##########################################################################################
        # Feed backwards the error deltas

        deltas = newArray( weigthSize )
        for l in iter(range(len(deltas))):
            deltaIndex = len(deltas) - l - 1  # 1,0
            layerIndex = len(layers) - l - 1  # 2,1
            if 0 == l:
                error = layers[ layerIndex ] - inputLabels
                if (j% 10000) == 0:
                    print ( "Error after "+str(j)+" iterations:" + str(np.mean(np.abs(error))) )
            else:
                error = deltas[ deltaIndex + 1 ].dot( weights[l].T)
            slope = sigmoid_output_to_derivative(layers[layerIndex])
            deltas[ deltaIndex ] = error * slope

        ##########################################################################################
        # update the weights

        for l in iter(range(len(weights))):
            update = layers[l].T.dot(deltas[l])
            weights[l] -= alpha * update

        ##########################################################################################

print( layers[2] );
