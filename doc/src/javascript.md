---
layout: default
title: MathSync
---

# Javascript

[Full API doc](/jsdoc) is available.

[![NPM](https://nodei.co/npm/mathsync.png)](https://nodei.co/npm/mathsync/)

## [Node.js](http://nodejs.org/) server

Add a dependency towards the library:

```"dependencies": {
  "mathsync": "0.4.x"
}
```

Create a endpoint fetching your items, serializing them and sending the summary over the wire (here done using [Koa](http://koajs.com/)):

```var ms = require('mathsync');

var data = [/* where do your items come from? */];

var serialize = ms.serialize.fromString(function (item) {
  /* how to serialize your item to string? */
});
var summarizer = ms.summarizer.fromItems(data, serialize);

var app = require('koa')();
var route = require('koa-route');

app.use(route.get('/summary/:level', function* (level) {
  this.body = yield summarizer(level | 0);
}));
```

The endpoint can be extended to expose session-specific summaries. It is possible to build custom serializers not going through a string.

## Browser client

It is currently recommended to use [Browserify](http://browserify.org/) to use the library on the browser side.

Add a dependency towards the library and to a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) provider (here using [Q](https://github.com/kriskowal/q) but any would comply):

```"dependencies": {
  "mathsync": "0.4.x",
  "q": "0.9.x"
}
```

Fetch the data structure from the endpoint, returning a promise:

```var ms = require('mathsync');
var http = require('http');
var q = require('q');

var data = [/* where do your items come from? */];

var serialize = ms.serialize.fromString(function (item) {
  /* how to serialize your item? */
});
var local = ms.summarizer.fromItems(data, serialize);

function fetchSummary(level) {
  var deferred = q.defer();

  http.get('http://localhost:8080/summary/' + level, function (res) {
    var chunks = [];
    res.on('data', function(chunk) {
      chunks.push(chunk);
    });
    res.on('end', function() {
      deferred.resolve(chunks);
    });
  }).on('error', deferred.reject);

  return deferred.promise.then(Buffer.concat).then(JSON.parse);
}
var remote = ms.summarizer.fromJSON(fetchSummary);

var deserialize = ms.serialize.toString(function (str) {
  /* how to deserialize your item? */
});
var resolve = ms.resolver.fromSummarizers(local, remote, deserialize);
```

and then call it whenever you want to synchronize wit the server:

```resolve().then(function (difference) {
  difference.removed.forEach(function (i) {
    /* remove deleted item locally! */
  });
  difference.added.forEach(function (i) {
    /* add new item locally! */
  });
});
```

## Generator

[![NPM](https://nodei.co/npm/mathsync-generator.png)](https://nodei.co/npm/mathsync-generator/)

An extended version of the library allows to use [generator functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators#Generators.3A_a_better_way_to_build_Iterators):

```"dependencies": {
  "mathsync-generator": "0.4.x"
}
```

and `yield` all you items inside the generator function:

```var ms = require('mathsync-generator');

var data = {};

var serialize = ms.serialize.fromString();

var local = ms.summarizer.fromGenerator(function* () {
  for (var k in data) {
    yield (k + ':' + data[k]);
  }
}, serialize);
```