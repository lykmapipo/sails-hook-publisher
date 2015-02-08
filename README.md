sails-hook-publisher
====================

[![Build Status](https://travis-ci.org/lykmapipo/sails-hook-publisher.svg?branch=master)](https://travis-ci.org/lykmapipo/sails-model-new)

[![Tips](https://img.shields.io/gratipay/lykmapipo.svg)](https://gratipay.com/lykmapipo/)

[![Support via Gratipay](https://cdn.rawgit.com/gratipay/gratipay-badge/2.3.0/dist/gratipay.svg)](https://gratipay.com/lykmapipo/)

Kue based job publisher(producer) for sails. Its a wrapper around [Kue](https://github.com/learnboost/kue) for publishing jobs by using [redis](https://github.com/antirez/redis) as a queue engine.

*Note: This requires Sails v0.11.0+.  If v0.11.0+ isn't published to NPM yet, you'll need to install it via Github.*

## Installation
```js
$ npm install --save sails-hook-publisher
```

## Usage
In the global scope `Publisher` will be available for use and it will expose the following `kue api's`:

### Creating Jobs
Calling `Publisher.create()` with the `type of job`, and arbitrary `job data` will return a kue `Job`, which can then be `save()`ed, adding it to redis, with a default priority level of "normal". The `save()` method optionally accepts a callback, responding with an `error` if something goes wrong. The `title` key is special-cased, and will display in the job listings within the UI, making it easier to find a specific job.

```js
var job = Publisher.create('email', {
    title: 'welcome email for tj'
  , to: 'tj@learnboost.com'
  , template: 'welcome-email'
}).save( function(err){
   if( !err ) console.log( job.id );
});
```

### Job Priority
To specify the priority of a job, simply invoke the `priority()` method with a number, or priority name, which is mapped to a number.

```js
Publisher.create('email', {
    title: 'welcome email for tj'
  , to: 'tj@learnboost.com'
  , template: 'welcome-email'
}).priority('high').save();
```

The default priority map is as follows:

```js
{
    low: 10
  , normal: 0
  , medium: -5
  , high: -10
  , critical: -15
};
```

### Failure Attempts
By default jobs only have _one_ attempt, that is when they fail, they are marked as a failure, and remain that way until you intervene. However, `sails-hook-publisher` allows you to specify this, which is important for jobs such as transferring an email, which upon failure, may usually retry without issue. To do this invoke the `.attempts()` method with a number.

```js
 Publisher.create('email', {
     title: 'welcome email for tj'
   , to: 'tj@learnboost.com'
   , template: 'welcome-email'
 }).priority('high').attempts(5).save();
```

### Failure Backoff
Job retry attempts are done as soon as they fail, with no delay, even if your job had a delay set via `Job#delay`. If you want to delay job re-attempts upon failures (known as backoff) you can use `Job#backoff` method in different ways:

```js
    // Honor job's original delay (if set) at each attempt, defaults to fixed backoff
    job.attempts(3).backoff( true )

    // Override delay value, fixed backoff
    job.attempts(3).backoff( {delay: 60*1000, type:'fixed'} )

    // Enable exponential backoff using original delay (if set)
    job.attempts(3).backoff( {type:'exponential'} )

    // Use a function to get a customized next attempt delay value
    job.attempts(3).backoff( function( attempts, delay ){
      return my_customized_calculated_delay;
    })
```

In the last scenario, provided function will be executed (via eval) on each re-attempt to get next attempt delay value, meaning that you can't reference external/context variables within it.

**Note** that backoff feature depends on `.delay` under the covers and therefore `.promote()` needs to be called if used.

### Job Events
Job-specific events are fired on the `Job` instances via `Redis pubsub`. The following events are currently supported:

    - `enqueue` the job is now queued
    - `promotion` the job is promoted from delayed state to queued
    - `progress` the job's progress ranging from 0-100
    - 'failed attempt' the job has failed, but has remaining attempts yet
    - `failed` the job has failed and has no remaining attempts
    - `complete` the job has completed


For example this may look something like the following:

```js
var job = Publisher.create('video conversion', {
    title: 'converting loki\'s to avi'
  , user: 1
  , frames: 200
});

job.on('complete', function(result){
  console.log("Job completed with data ", result);
}).on('failed', function(){
  console.log("Job failed");
}).on('progress', function(progress){
  process.stdout.write('\r  job #' + job.id + ' ' + progress + '% complete');
});
```

**Note** that Job level events are not guaranteed to be received upon worker process restarts, since the process will lose the reference to the specific Job object. If you want a more reliable event handler look for [Queue Events](#queue-events).

### Queue Events
Queue-level events provide access to the job-level events previously mentioned, however scoped to the `Queue` instance to apply logic at a "global" level. An example of this is removing completed jobs:
 
```js
Publisher.on('job enqueue', function(id,type){
  console.log( 'job %s got queued', id );
});

Publisher.on('job complete', function(id,result){
  Publisher.Job.get(id, function(err, job){
    if (err) return;
    job.remove(function(err){
      if (err) throw err;
      console.log('removed completed job #%d', job.id);
    });
  });
});
```

The events available are the same as mentioned in "Job Events", however prefixed with "job ". 

### Delayed Jobs
Delayed jobs may be scheduled to be queued for an arbitrary distance in time by invoking the `.delay(ms)` method, passing the number of milliseconds relative to _now_. This automatically flags the `Job` as "delayed". 

```js
var email = Publisher.create('email', {
    title: 'Account renewal required'
  , to: 'tj@learnboost.com'
  , template: 'renewal-email'
}).delay(milliseconds)
  .priority('high')
  .save();
```

When using delayed jobs, we must also check the delayed jobs with a timer, promoting them if the scheduled delay has been exceeded. This `setInterval` is defined within `Queue#promote(ms,limit)`, defaulting to a check of top 200 jobs every 5 seconds. If you have a cluster of kue processes, you must call `.promote` in just one (preferably master) process or promotion race can happen.

```js
Publisher.promote();
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