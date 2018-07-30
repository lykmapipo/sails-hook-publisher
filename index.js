'use strict';

/**
 * @description Kue based job publisher(producer) for sails.
 *
 * @param  {Object} sails a sails application
 * @return {Object} sails-hook-publisher which follow installable sails-hook spec
 */
module.exports = function(sails) {
    var kue = require('kue');

    //reference kue based queue
    var publisher;
    /**
     * Retrieve the default hooks configs with any other global redis config
     */
    function getDefaultConfig() {
      //get extended default config
      var config = sails.config[this.configKey] || {};
      // extend any custom redis configs based on specific global env config
      if (sails.config.redis) { 
        config = Object.assign(config, {'redis':Object.assign(config.redis, sails.config.redis)});
      }
    
      return config;
    }

    //return hook
    return {

        //Defaults configurations
        defaults: {
            __configKey__: {
                //control activeness of publisher
                //its active by default
                active: true,

                // default key prefix for kue in
                // redis server
                prefix: 'q',

                //default redis configuration
                redis: {
                    //default redis server port
                    port: 6379,
                    //default redis server host
                    host: '127.0.0.1'
                },
                //number of milliseconds
                //to wait 
                //before shutdown publisher
                shutdownDelay: 5000
            }
        },

        //expose kue create
        //to allow job creation using publisher
        create: undefined,
        createJob: undefined,

        //expose publisher (kue queue) as a queue
        //that can be used to listen to queue events
        //Warning!: aim of this queue is to only
        //create jobs and listen for queue events, 
        //if you want to subscribe/process jobs
        //consider using `https://github.com/lykmapipo/sails-hook-subscriber`
        queue: publisher,

        //Runs automatically when the hook initializes
        initialize: function(done) {
            //reference this hook
            var hook = this;

            //extend defaults configuration
            //with provided configuration from sails
            //config
            var config = getDefaultConfig.call(this);
            
            // If the hook has been deactivated, just return
            if (!config.active) {
                sails.log.info('sails-hooks-publisher deactivated.');
                return done();
            }

            // Lets wait on some of the sails core hooks to
            // finish loading before 
            // load `sails-hoo-publisher`
            var eventsToWaitFor = [];

            if (sails.hooks.orm) {
                eventsToWaitFor.push('hook:orm:loaded');
            }

            if (sails.hooks.pubsub) {
                eventsToWaitFor.push('hook:pubsub:loaded');
            }

            sails
                .after(eventsToWaitFor, function() {
                    //initialize publisher
                    publisher = kue.createQueue(config);

                    //attach queue
                    hook.queue = publisher;

                    //expose job creation api
                    hook.create = publisher.create;
                    hook.createJob = publisher.create;

                    //shutdown kue publisher
                    //and wait for time equal to `shutdownDelay` 
                    //for workers to finalize their jobs
                    function shutdown() {
                        publisher
                            .shutdown(config.shutdownDelay, function(error) {
                                sails.emit('subscribe:shutdown', error || '');

                            });
                    }

                    //gracefully shutdown
                    //publisher
                    sails.on('lower', shutdown);
                    sails.on('lowering', shutdown);

                    //tell external world we are up
                    //and running
                    sails.on('lifted', function() {
                        sails.log('sails-hook-publisher loaded successfully');
                    });

                    // finalize publisher setup
                    done();
                });
        }
    };
};