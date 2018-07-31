'use strict';

/**
 * This file is useful when you want to execute some
 * code before and after running your tests
 * (e.g. lifting and lowering your sails application):
 */
var sails = require('sails');
/**
 * Lifting sails before all tests
 */
before(function(done) {
    sails
        .lift({ // configuration for testing purposes
            port: 7070,
            environment: 'test',
            redis: {
              host: '127.0.0.1'
            },
            log: {
                noShip: true
            },
            models: {
                migrate: 'drop'
            },
            hooks: {
                sockets: false,
                pubsub: false,
                grunt: false //we dont need grunt in test
            }
        }, function(error, sails) {
            if (error) {
                return done(error);
            }
            done(null, sails);
        });
});


/**
 * Lowering sails after done testing
 */
after(function(done) {
    User
        .destroy()
        .then(function() {
            sails.lower(done);
        })
        .catch(function(error) {
            done(error);
        });
});