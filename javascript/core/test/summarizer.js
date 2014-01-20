(function () {
  'use strict';

  var assert = require('assert');
  var _ = require('underscore');
  var summarizer = require('../src/summarizer');
  var sha1 = require('../src/sha1');
  var utils = require('./utils_typedarrays');
  var selector = require('../src/bucketSelector').padAndHash(sha1, 3);

  function assertThatSetOfArrayEquals(arr1, arr2) {
    assert.equal(arr1.lenght, arr2.lenght);
    assert.ok(_(arr1).every(function (item1) {
      return _(arr2).some(function (item2) {
        return utils.isEqual(item1, item2);
      });
    }));
  }

  function testSummarizer(builder) {
    it('generate summary with input items', function(done) {
      function serialize(value) {
        return new Int8Array(value).buffer;
      }

      builder([[1, 2], [2, 2], [3, 2]], serialize)(5).then(function (summary) {
        var diff = summary._asDifference();
        assertThatSetOfArrayEquals(diff.added, [[1, 2], [2, 2], [3, 2]]);
        assert.equal(0, diff.removed.length);
        done();
      }, function (err) {
        done(err);
      });
    });
  }

  describe('Summarizer', function() {
    describe('fromItems', function() {
      testSummarizer(function (array, serialize) {
        return summarizer.fromItems(array, serialize, sha1, selector);
      });
    });

    describe('fromJSON', function() {
      testSummarizer(function (array, serialize) {
        var original = summarizer.fromItems(array, serialize, sha1, selector);
        var throughJson = summarizer.fromJSON(function (level) {
          return original(level).then(function (summary) {
            return summary.toJSON();
          });
        }, sha1, selector);
        return throughJson;
      });
    });

    describe('fromLarge', function() {
      testSummarizer(function (array, serialize) {
        var large = summarizer.fromItems(array, serialize, sha1, selector)(10);
        var throughLarge = summarizer.fromLarge(function () {
          return large;
        }, sha1, selector);
        return throughLarge;
      });
    });
  });
})();