var expect = require('chai').expect;
var kue = require('kue');
var faker = require('faker');
var async = require('async');

var email = faker.internet.email();
var username = faker.internet.userName();

describe('Hook#publisher', function() {

    it('should be loaded as installable hook', function(done) {
        expect(sails.hooks.publisher).to.not.be.null;
        done();
    });

    it('should have defaults configuration', function(done) {
        var publisher = sails.hooks.publisher;

        expect(publisher.defaults).to.not.be.null;
        expect(publisher.defaults.prefix).to.equal('q');
        expect(publisher.defaults.shutdownDelay).to.equal(5000);
        expect(publisher.defaults.redis.port).to.equal(6379);
        expect(publisher.defaults.redis.host).to.equal('127.0.0.1');

        done();
    });

    it('should have a queue to create job(s) and listen for queue events', function(done) {
        var publisher = sails.hooks.publisher;

        expect(publisher.queue).to.not.be.null;
        expect(publisher.queue).to.be.a('object');

        done();
    });

    it('should be able create job(s)', function(done) {
        var publisher = sails.hooks.publisher;

        expect(publisher.create).to.not.be.null;
        expect(publisher.createJob).to.not.be.null;
        expect(publisher.createJob).to.be.a('function');
        expect(publisher.create).to.be.a('function');

        done();
    });

    it('should be able published job(s) to workers for processing and listen for queue events', function(done) {
        var subscriber = kue.createQueue();
        var publisher = sails.hooks.publisher;

        //fake subsriber
        //you may use https://github.com/lykmapipo/sails-hook-subscriber
        //for sails ready kue subscriber
        subscriber
            .process('email', function(job, done) {
                done(null, {
                    sentAt: new Date(),
                    status: 'ok'
                });
            });

        //use publihser to create job
        var job = publisher.create('email', {
            title: 'welcome ' + username,
            to: email,
            message: 'welcome !!'
        });

        //listen for publisher queue events
        publisher
            .queue
            .on('job complete', function(id, deliveryStatus) {
                expect(deliveryStatus.sentAt).to.not.be.null;
                expect(deliveryStatus.status).to.not.be.null;
                done();
            });

        job
            .save(function(error) {
                if (error) {
                    done(error);
                }
            });
    });

});