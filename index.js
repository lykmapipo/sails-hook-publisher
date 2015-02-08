/**
 * @description Kue based job publisher(producer) for sails.
 *
 * @param  {Object} sails a sails application
 * @return {Object} sails-hook-publisher which follow installable sails-hook spec
 */
module.exports = function(sails) {
    var kue = require('kue');
    var _ = require('lodash');

    //reference kue based queue
    var publisher;

    //return hook
    return {

        //Defaults configurations
        defaults: {
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
            var config =
                _.extend(hook.defaults, sails.config.publisher);

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
                    //and wait for time equla to `shutdownDelay` 
                    //for workers to finalize their jobs
                    function shutdown() {
                        publisher
                            .shutdown(function(error) {
                                sails.emit('subscribe:shutdown', error || '');

                            }, config.shutdownDelay);
                    };

                    //gracefully shutdown
                    //publisher
                    sails.on("lower", shutdown);
                    sails.on("lowering", shutdown);

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