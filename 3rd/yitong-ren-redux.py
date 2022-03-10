# https://towardsdatascience.com/a-step-by-step-implementation-of-gradient-descent-and-backpropagation-d58bda486110
import numpy as np
class NeuralNetwork:
    def __init__(self):
        np.random.seed(10) # for generating the same results
        self.weights = [0,0]
        self.weights[0] = np.random.rand(3,4) # input to hidden layer weights
        self.weights[1] = np.random.rand(4,1) # hidden layer to output weights
        
    def sigmoid(self, z):
        return 1/(1 + np.exp(-z))
    
    def sigmoid_derivative(self, z):
        return self.sigmoid(z) * (1 - self.sigmoid(z))
    
    def gradient_descent(self, x, y, iterations):
        layers = [0,0,0]
        for i in range(iterations):
            ##############################################################################
            # forward

            layers[0] = x
            layers[1] = self.sigmoid( np.dot( layers[0], self.weights[0] ) )
            layers[2] = self.sigmoid( np.dot( layers[1], self.weights[1] ) )

            ##############################################################################
            # back propagation

            gradients = [0,0] 
            delta = [0,0] 
            lastWeightIndex = len( self.weights ) - 1
            for i in range( lastWeightIndex, -1, -1 ):
                slope = self.sigmoid_derivative( np.dot( layers[i], self.weights[i] ) )
                if i == lastWeightIndex:
                    error = y - layers[2]
                else:
                    error = np.dot(delta[i+1], self.weights[i+1].T)
                delta[i] = error * slope
                gradients[i] = np.dot(layers[i].T, delta[i]) 

            # update weights
            for i in range( len( self.weights ) ):
                self.weights[i] += gradients[i]

        print('The final prediction from neural network are: ')
        print(layers[2])
if __name__ == '__main__':
    neural_network = NeuralNetwork()
    print('Random starting input to hidden weights: ')
    print(neural_network.weights[0])
    print('Random starting hidden to output weights: ')
    print(neural_network.weights[1])
    X = np.array([[0, 0, 1], [1, 1, 1], [1, 0, 1], [0, 1, 1]])
    y = np.array([[0, 1, 1, 0]]).T
    neural_network.gradient_descent(X, y, 10000)
