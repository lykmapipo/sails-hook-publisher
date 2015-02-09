sails-hook-publisher
====================

[![Build Status](https://travis-ci.org/lykmapipo/sails-hook-publisher.svg?branch=master)](https://travis-ci.org/lykmapipo/sails-hook-publisher)

[![Tips](https://img.shields.io/gratipay/lykmapipo.svg)](https://gratipay.com/lykmapipo/)

[![Support via Gratipay](https://cdn.rawgit.com/gratipay/gratipay-badge/2.3.0/dist/gratipay.svg)](https://gratipay.com/lykmapipo/)

Kue based job publisher(producer) for sails. Its a wrapper around [Kue](https://github.com/learnboost/kue) for publishing jobs by using [redis](https://github.com/antirez/redis) as a queue engine.

*Note: This requires Sails v0.11.0+.  If v0.11.0+ isn't published to NPM yet, you'll need to install it via Github.*

## Installation
```js
$ npm install --save sails-hook-publisher
```

## Usage
In sails hooks, `sails.hooks.publisher` will be available for use and it will expose:

- `queue` : a `kue` based job queue specifially for publish jobs. If you want to consume jobs you may use [sails-hook-subscriber](https://github.com/lykmapipo/sails-hook-subscriber). It is a valid `kue queue` so you can also invoke other `kue` methods from it. [See](https://github.com/LearnBoost/kue#overview)

- `create` or `createJob` : which is a proxy for `kue.create` and `kue.createJob` respectively. See [kue creating jobs for detailed explanations](https://github.com/LearnBoost/kue#creating-jobs) 

## Publishing Jobs
Use `sails.hooks.publisher.create` or `sails.hooks.publisher.createJob` to publish job(s) as way you used with `kue`. You can publish jobs in any place within your sails application where `sails.hooks` is accessible and `sails.hook.publisher` is loaded and available.

Example
```js
//in AuthController.js
//in register(request,response) method

register: function(request,response){
      //your codes ....

      //grab publisher
      var publisher = sails.hooks.publisher;
      
      //publish send confirmation email
      var job = publisher.create('email', {
        title: 'Welcome'
      , to: request.email,
      , template: 'welcome-email'
     })
     .save();
}
```
*Note: The above example demostrate `sails-hook-publisher` usage in controller you can use it in your models and services too*

## Queue Events
`sails-hook-publisher` expose `queue` which is the underlying `kue queue` it use for listening for queue events. For you to listen on your job events on the queue, just add listener on the publisher `queue.on`. [see kue queue events for more explanation](https://github.com/LearnBoost/kue#queue-events)

Example:
```js
//somewhere in your codes just once
//prefered on config/bootstrap.js
//or custom hook
//or services
var publisher = sails.hooks.publisher;

//add listener on the queue
publisher
          .queue
          .on('job complete', function(id, jobResult) {
              //your codes here
          });
```

## Configuration
`sails-hook-publisher` accept application defined configuration by utilizing sails configuration api. In sails `config` directory add `config/publisher.js` and you will be able to override all the defauts configurations.

Simply, copy the below and add it to your `config/publisher.js`
```js
module.exports.publisher = {
    //default key prefix for kue in
    //redis server
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
```

## Testing

* Clone this repository

* Install all development dependencies

```sh
$ npm install
```
* Then run test

```sh
$ npm test
```

## Contribute

Fork this repo and push in your ideas. 
Do not forget to add a bit of test(s) of what value you adding.

## Licence

Copyright (c) 2015 lykmapipo

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 