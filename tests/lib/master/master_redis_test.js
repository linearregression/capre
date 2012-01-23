'use strict'

var _ = require('underscore')
var assert = require('assert')
var uuid = require('node-uuid')

var sinon = require('sinon')

var Master = require('../../../lib/master/master')
var MasterRedisAdaptor = require('../../../lib/master/adaptors/redis')
var redis = require("redis")

describe('master', function() {
  var master, backend

  before(function(done) {
    backend = new MasterRedisAdaptor(function() {
      master = new Master(backend, done)
    })
  })
  afterEach(function(done) {
    backend.flush(done)
  })
  describe('register', function() {
    it('can register types', function(done) {
      var type = 'SomeType'
      master.register(type, function(err, typeData) {
        assert.ok(!err)
        assert.equal(typeData.syndex, 0)
        done()
      })
    })
    it('will error if already registered type', function(done) {
      var type = 'SomeType'
      master.register(type, function(err, syndex) {
        master.register(type, function(err, syndex) {
          assert.ok(err)
          assert.ok(/exists/.test(err.message))
          done()
        })
      })
    })
  })
  describe('getTypes', function() {
    it('should be able to get registered types', function(done) {
      var userType = 'User'
      var streamType = 'Stream'
      master.register(userType, function(err) {
        assert.ok(!err)
        master.register(streamType, function(err) {
          assert.ok(!err)
          master.getTypes(function(err, types) {
            assert.ok(!err)
            assert.ok(types)
            assert.equal(types.length, 2)
            assert.ok(_.find(types, function(item) {
              return item === userType
            }))
            assert.ok(_.find(types, function(item) {
              return item === streamType
            }))
            done()
          })
        })
      })
    })
  })
  describe('getSyndex', function() {
    var type = 'User'
    beforeEach(function(done) {
      master.register(type, done)
    })
    it('should be able to get syndex for a type', function(done) {
      master.getSyndex(type, function(err, syndex) {
        assert.ok(!err)
        assert.equal(syndex, 0)
        done()
      })
    })
    it('should error if getting syndex of unknown type', function(done) {
      var unknownType = 'unknownType'
      master.getSyndex(unknownType, function(err, syndex) {
        assert.ok(err)
        assert.ok(/unknown/.test(err.message))
        done()
      })
    })
    //it('should be able to get syndex for an id', function(done) {
      //var id = uuid()
      //master.insert(type, id, function(err) {
        //assert.ok(!err)
        //master.getSyndex(type, id, function(err, syndex) {
          //assert.ok(!err)
          //assert.equal(syndex, 1)
          //done()
        //})
      //})
    //})
    //it('should return null for getting syndex of unknown id', function(done) {
      //var nonExistingID = uuid()
      //master.getSyndex(type, nonExistingID, function(err, syndex) {
        //assert.ok(!err)
        //assert.strictEqual(syndex, null)
        //done()
      //})
    //})
    //it('should return err for getting syndex of unknown type', function(done) {
      //var nonExistingID = uuid()
      //var unknownType = 'unknownType'
      //master.getSyndex(unknownType, nonExistingID, function(err, syndex) {
        //assert.ok(err)
        //assert.ok(/unknown/.test(err.message))
        //done()
      //})
    //})
  })
  //describe('get', function() {
    //var type = 'User'
    //it('should get data for an id', function(done) {
      //var id = uuid()
      //master.insert(type, id, function(err) {
        //assert.ok(!err)
        //master.get(type, id, function(err, data) {
          //assert.ok(!err)
          //assert.equal(data.id, id)
          //assert.equal(data.syndex, 1)
          //assert.equal(data.op, 'insert')
          //done()
        //})
      //})
    //})
  //})
  describe('find', function() {
    var type = 'User'
    it('can find things', function(done) {
      master.register(type, function(err) {
        var id = uuid()
        master.insert(type, id, function(err) {
          master.find(type, id, function(err, found) {
            console.log(arguments)
            assert.ok(!err)
            assert.ok(found)
            assert.ok(found.id)
            done()
          })
        })
      })
    })
  })
  describe('insert', function() {
    var type = 'User'
    beforeEach(function(done) {
      master.register(type, done)
    })
    describe('should be able to insert an object of type', function() {
      var data, id
      beforeEach(function(done) {
        id = uuid()
        master.insert(type, id, function(err, insertData) {
          assert.ok(!err)
          data = insertData
          done()
        })
      })
      describe('returned data', function() {
        it('should have syndex of one', function() {
          assert.equal(data.syndex, 1)
        })
        it('should have op of insert', function() {
          assert.equal(data.op, 'insert')
        })
        it('should have supplied id', function() {
          assert.equal(data.id, id)
        })
      })
      it('added to master list', function(done) {
        master.getSyndex(type, id, function(err, syndex) {
          assert.ok(!err)
          assert.equal(syndex, 1)
          done()
        })
      })
    })
    //it('should increase syndex each insert', function(done) {
      //var NUM_ITEMS = 100
      //// purposely match i with increasing syndex
      //var count = 0;
      //for (var i = 1; i <= NUM_ITEMS; i++) {
        //var id = uuid()
        //// because of async, need to fix value of i to function scope
        //var insert = function(i) {
          //master.insert(type, id, function(err, data) {
            //assert.ok(!err)
            //assert.equal(data.syndex, i)
            //if (count++ === NUM_ITEMS - 1) done()
          //})
        //}
        //insert(i)
      //}
    //})
    //it('should return err if inserting item with existing id', function(done) {
      //var id = uuid()
      //master.insert(type, id, function(err, data) {
        //master.insert(type, id, function(err, data) {
          //assert.ok(err)
          //assert.ok(/duplicate/.test(err.message))
          //master.getSyndex(type, id, function(err, syndex) {
            //assert.ok(!err)
            //assert.equal(syndex, 1)
            //done()
          //})
        //})
      //})
    //})
    //it('should not return err for inserting on unknown type', function(done) {
      //var id = uuid()
      //var unknownType = 'unknownType'
      //master.insert(unknownType, id, function(err, data) {
        //assert.ok(!err)
        //assert.equal(data.syndex, 1)
        //master.getSyndex(unknownType, id, function(err, syndex) {
          //assert.ok(!err)
          //assert.equal(syndex, 1)
          //done()
        //})
      //})
    //})
  })
  //describe('update', function() {
    //var type = 'User'
    //var id = uuid()
    //beforeEach(function(done) {
      //master.register(type, function(err) {
        //assert.ok(!err)
        //master.insert(type, id, function(err) {
          //assert.ok(!err)
          //done()
        //})
      //})
    //})
    //it('should error if not supplied a type', function(done) {
      //master.update(null, function(err) {
        //assert.ok(err)
        //assert.ok(/type/.test(err.message))
        //done()
      //})
    //})

    //it('should be able to update existing id', function(done) {
      //master.update(type, id, function(err, data) {
        //assert.ok(!err)
        //assert.equal(data.syndex, 2)
        //master.getSyndex(type, id, function(err, syndex) {
          //assert.ok(!err)
          //assert.equal(syndex, 2)
          //done()
        //})
      //})
    //})
    //it('should increase syndex each time', function(done) {
      //var NUM_ITEMS = 100
      //// purposely match i with increasing syndex
      //var count = 0;
      //for (var i = 1; i <= NUM_ITEMS; i++) {
        //// because of async, need to fix value of i to function scope
        //var insert = function(i) {
          //master.update(type, id, function(err, data) {
            //assert.ok(!err)
            //assert.equal(data.syndex, i + 1) // syndex 1 will be taken by initial insert
            //assert.equal(data.op, 'update')
            //if (count++ === NUM_ITEMS - 1) done()
          //})
        //}
        //insert(i)
      //}
    //})
    //it('should return err for updating on unknown type', function(done) {
      //var unknownType = 'unknownType'
      //master.update(unknownType, id, function(err) {
        //assert.ok(err)
        //assert.ok(/unknown/.test(err.message))
        //done()
      //})
    //})
    //it('should return err for updating on unknown item', function(done) {
      //var unknownId = 'unknownid'
      //master.update(type, unknownId, function(err) {
        //assert.ok(err)
        //assert.ok(/not found/.test(err.message))
        //done()
      //})
    //})
  //})
  //describe('upsert', function() {
    //var type = 'User'
    //var id = uuid()
    //beforeEach(function(done) {
      //master.register(type, function() {
        //master.upsert(type, id, function(err) {
          //done()
        //})
      //})
    //})
    //it('should error if not supplied a type', function(done) {
      //master.upsert(null, function(err) {
        //assert.ok(err)
        //assert.ok(/type/.test(err.message))
        //done()
      //})
    //})
    //it('should be able to update existing id', function(done) {
      //master.upsert(type, id, function(err, data) {
        //assert.ok(!err)
        //assert.equal(data.syndex, 2)
        //master.getSyndex(type, id, function(err, syndex) {
          //assert.ok(!err)
          //assert.equal(syndex, 2)
          //done()
        //})
      //})
    //})
    //it('should be able to upsert a new object of type', function(done) {
      //var id = uuid()
      //master.upsert(type, id, function(err, data) {
        //assert.ok(!err)
        //assert.equal(data.syndex, 2) // remember, we inserted on in the beforeEach
        //master.getSyndex(type, id, function(err, syndex) {
          //assert.ok(!err)
          //assert.equal(syndex, 2)
          //done()
        //})
      //})
    //})

    //it('should increase syndex each time', function(done) {
      //var NUM_ITEMS = 100
      //// purposely match i with increasing syndex
      //var count = 0;
      //for (var i = 1; i <= NUM_ITEMS; i++) {
        //// because of async, need to fix value of i to function scope
        //var insert = function(i) {
          //master.upsert(type, id, function(err, data) {
            //assert.ok(!err)
            //assert.equal(data.syndex, i + 1) // syndex 1 will be taken by initial insert
            //if (count++ === NUM_ITEMS - 1) done()
          //})
        //}
        //insert(i)
      //}
    //})
    //it('should not return err for upserting on unknown type', function(done) {
      //var id = uuid()
      //var unknownType = 'unknownType'
      //master.upsert(unknownType, id, function(err, data) {
        //assert.ok(!err)
        //assert.equal(data.syndex, 1)
        //master.getSyndex(unknownType, id, function(err, syndex) {
          //assert.ok(!err)
          //assert.equal(syndex, 1)
          //done()
        //})
      //})
    //})
  //})
  //describe('sync', function(type, syndex) {
    //var type = 'User'
    //it('should error if not supplied a type', function(done) {
      //master.sync(null, function(err) {
        //assert.ok(err)
        //assert.ok(/type/.test(err.message))
        //done()
      //})
    //})
    //it('should get ids > supplied index', function(done) {
      //var id1 = uuid()
      //master.insert(type, id1, function(err) {
        //assert.ok(!err)
        //var id2 = uuid()
        //master.insert(type, id2, function(err, data) {
          //assert.ok(!err)
          //var currentSyndex = data.syndex - 1
          //// we want to grab just this most recent item
          //master.sync(type, currentSyndex, function(err, items, typeInfo) {
            //assert.ok(!err)
            //assert.equal(items.length, 1)
            //assert.equal(data.syndex, typeInfo.syndex)
            //assert.equal(items[0].id, id2)
            //done()
          //})
        //})
      //})
    //})
    //it('shouldn\'t err for unknown types, just return no items', function(done) {
      //var currentSyndex = 12
      //var unknownType = 'unknownType'
      //master.sync(unknownType, currentSyndex, function(err, items, syndex) {
        //assert.ok(!err)
        //assert.equal(items.length, 0)
        //done()
      //})
    //})
    //describe('bulk', function() {
      //var NUM_ITEMS = 100
      //beforeEach(function(done) {
        //var count = 0
        //for (var i = 0; i < NUM_ITEMS; i++) {
          //var id = uuid()
          //master.insert(type, id, function(err, success) {
            //assert.ok(!err)
            //assert.ok(success)
            //if (++count === NUM_ITEMS) {
              //done()
            //}
          //})
        //}
      //})
      //it('should get all ids > supplied index', function(done) {
        //var currentSyndex = 12
        //master.sync(type, currentSyndex, function(err, items, syndex) {
          //assert.ok(!err)
          //assert.equal(items.length, NUM_ITEMS - currentSyndex)
          //_.every(items, function(item) {
            //return item.syndex > currentSyndex
          //})
          //done()
        //})
      //})
    //})
  //})
  //describe('remove', function() {
    //var type = 'User'
    //var id
    //beforeEach(function(done) {
      //id = uuid()
      //master.insert(type, id, function(err, data) {
        //assert.ok(!err)
        //done()
      //})
    //})
    //it('should error if not supplied a type', function(done) {
      //master.remove(null, function(err) {
        //assert.ok(err)
        //assert.ok(/type/.test(err.message))
        //done()
      //})
    //})
    //describe('should be able to remove an object of type', function() {
      //var data
      //beforeEach(function(done) {
        //master.remove(type, id, function(err, removeData) {
          //assert.ok(!err)
          //data = removeData
          //done()
        //})
      //})
      //describe('returned data', function() {
        //it('should have syndex of two', function() {
          //assert.equal(data.syndex, 2)
        //})
        //it('should have op of remove', function() {
          //assert.equal(data.op, 'remove')
        //})
        //it('should have supplied id', function() {
          //assert.equal(data.id, id)
        //})
        //it('should be able to be gotten and still be \'removed\'', function(done) {
          //master.get(type, data.id, function(err, item) {
            //assert.ok(!err)
            //assert.equal(item.id, data.id)
            //assert.equal(item.op, 'remove')
            //done()
          //})
        //})
      //})
    //})
    //it('should return err for removing on unknown item', function(done) {
      //var unknownId = 'unknownid'
      //master.remove(type, unknownId, function(err) {
        //assert.ok(err)
        //assert.ok(/not found/.test(err.message))
        //done()
      //})
    //})
    //it('should return err for removing on unknown type', function(done) {
      //var unknownType = 'unknownType'
      //master.remove(unknownType, id, function(err) {
        //assert.ok(err)
        //assert.ok(/unknown/.test(err.message))
        //done()
      //})
    //})
  //})
})