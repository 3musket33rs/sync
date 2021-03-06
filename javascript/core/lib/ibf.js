'use strict';

var emptyBucket = require('./bucket');
var Promise = require('./promise');

function arraysEqual(a, b) {
  if (!a || !b) {
    return false;
  }
  if (a.byteLength !== b.byteLength) {
    return false;
  }
  a = new Int8Array(a);
  b = new Int8Array(b);
  for (var i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

function bucketsOfSize(size) {
  var buckets = [];
  for (var i = 0; i < size; i++) {
    buckets.push(emptyBucket);
  }
  return buckets;
}

function ibfFromBuckets(buckets, digest, selector) {

  function toJSON() {
    var json = [];
    buckets.forEach(function (bucket) {
      json.push(bucket.toJSON());
    });
    return json;
  }

  function copyBuckets() {
    var copy = [];
    for (var i = 0; i < buckets.length; i++) {
      copy.push(buckets[i]);
    }
    return copy;
  }

  function modifyOneWithSideEffect(bucketsCopy, variation, content) {
    var digested = digest(content);
    var selected = selector(bucketsCopy.length, content);
    for (var i = 0; i < selected.length; i++) {
      var b = selected[i] % bucketsCopy.length;
      bucketsCopy[b] = bucketsCopy[b].modify(variation, content, digested);
    }
  }

  function modifyManyWithSideEffect(variation, updater) {
    return new Promise(function (resolve, reject) {
      var bucketsCopy = copyBuckets();
      var isClosed = false;
      function item(i) {
        if (!isClosed) {
          modifyOneWithSideEffect(bucketsCopy, variation, i);
        }
      }
      function done() {
        isClosed = true;
        resolve(bucketsCopy);
      }
      updater(item, done, reject);
    }).then(function (modified) {
      return ibfFromBuckets(modified, digest, selector);
    });
  }

  function plus(content) {
    if (!(content instanceof ArrayBuffer)) {
      throw new TypeError('Ibf#plus takes an ArrayBuffer, given ' + content);
    }
    var bucketsCopy = copyBuckets();
    modifyOneWithSideEffect(bucketsCopy, 1, content);
    return ibfFromBuckets(bucketsCopy, digest, selector);
  }

  function plusMany(updater) {
    return modifyManyWithSideEffect(1, updater);
  }

  function plusIbf(other) {
    var merged = other._copyBuckets();
    if (merged.length !== buckets.length) {
      throw new Error('Cannot merge IBF of different sizes');
    }
    for (var i = 0; i < merged.length; i++) {
      merged[i] = merged[i].group(buckets[i]);
    }
    return ibfFromBuckets(merged, digest, selector);
  }

  function minus(content) {
    if (!(content instanceof ArrayBuffer)) {
      throw new TypeError('Ibf#minus takes an ArrayBuffer, given ' + content);
    }
    var bucketsCopy = copyBuckets();
    modifyOneWithSideEffect(bucketsCopy, -1, content);
    return ibfFromBuckets(bucketsCopy, digest, selector);
  }

  function minusMany(updater) {
    return modifyManyWithSideEffect(-1, updater);
  }

  function toDifference() {
    var bucketsCopy = copyBuckets();
    var l = bucketsCopy.length;

    var added = [];
    var removed = [];

    // Search for unary buckets until there is nothing to do
    var i, items, b, verified, found = true;
    while (found) {
      found = false;
      for (i = 0; i < l; i++) {
        b = bucketsCopy[i];
        items = b.items();
        if (items === 1 || items === -1) {
          verified = verify(b);
          if (verified !== null) {
            switch (items) {
            case 1:
              added.push(verified);
              break;
            case -1:
              removed.push(verified);
              break;
            }
            modifyOneWithSideEffect(bucketsCopy, -items, verified);
            found = true;
          }
        }
      }
    }

    // If some buckets are not empty, there was not enough information to deserialize
    for (i = 0; i < l; i++) {
      if (!bucketsCopy[i].isEmpty()) {
        return null;
      }
    }
    return { added: added, removed: removed };
  }

  function verify(bucket) {
    var content = bucket.xored();
    var view = new Int8Array(content);
    var trim = 0;
    while (true) {
      if (arraysEqual(digest(content), bucket.hashed())) {
        return content;
      }
      if (view.length > trim && view[view.length - trim - 1] === 0) {
        content = content.slice(0, content.byteLength - 1);
      } else {
        return null;
      }
      trim++;
    }
  }

  var that = {
    toDifference : toDifference,
    plus : plus,
    plusMany : plusMany,
    plusIbf : plusIbf,
    minus : minus,
    minusMany : minusMany,
    toJSON : toJSON,
    _copyBuckets : copyBuckets
  };

  return that;
}

function ibf(size, digest, selector) {
  return ibfFromBuckets(bucketsOfSize(size), digest, selector);
}

function fromJSON(json, digest, selector) {
  var buckets = [];
  json.forEach(function (bucket) {
    buckets.push(emptyBucket.fromJSON(bucket));
  });
  return ibfFromBuckets(buckets, digest, selector);
}
ibf.fromJSON = fromJSON;

module.exports = ibf;
