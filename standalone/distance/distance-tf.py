#!/usr/bin/env python

import numpy as np
import math
import tensorflow as tf

def create_data( count = 10 ):
    inputs = np.random.random([count,3]);
    inputs.sort()
    return inputs, np.array([ [math.sqrt((v*v).sum())] for v in inputs ])

def distance_tf():
    # the hyperparameters

    learning_rate = .0001 
    batch_size    = 3
    epochs        = 10

    training_size = 1000 * 17
    testing_size  = 1000 * 3

    # create the model

    model = tf.keras.Sequential() # not tf.keras.models.Sequential() apparently...
    model.add( tf.keras.layers.Dense(units=1, input_shape=(3,)))

    model.compile(
        optimizer = tf.keras.optimizers.RMSprop( learning_rate = learning_rate )
        , loss    = "mean_squared_error"
        , metrics = [ tf.keras.metrics.RootMeanSquaredError() ]
    )

    # train the model

    training_inputs, training_labels = create_data( training_size )

    history = model.fit(
          x = training_inputs
        , y = training_labels
        , batch_size = batch_size
        , epochs = epochs
        , shuffle = True
    )
    #print( 'history', history )
    #print( 'history.history', history.history )
    #print( 'history.epoch', history.epoch )
    for weight in model.weights:
        print( '>weight', np.array( weight ).flatten() )

    # test the model

    testing_inputs, testing_labels = create_data( testing_size )

    model.evaluate( 
          x = testing_inputs
        , y = testing_labels
        , batch_size = batch_size
    )

    # the end

distance_tf()

# eof
##############################################################################
