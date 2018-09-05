const config = require('../config/config.json');
const assert = require('assert');
const should = require('should');
var request = require('superagent');
let fs = require('fs');
let expected = require('../testdata/expectedData.json');
let input = require('../testdata/inputData.json');
const key = fs.readFileSync('./testdata/xxxx.key');
const cert = fs.readFileSync('./testdata/xxxx.crt');

describe('Healthcheck API', () => {
    
    test('GET API test', done => {
        request
        .get(config.baseURL+'users')
        .set('Content-Type', 'application/json')
        .end(function(err, res) 
        {
            res.status.should.equal(200)
            done()
        })
    });

    test('POST API test', done => {
        request
      .post(config.baseURL+'v1/messages')
      .set('Content-Type', 'application/json')
      .key(key)
      .cert(cert)
      .send(input.testText)
      .end((err, res) => {
        assert.ifError(err);
        assert.deepStrictEqual(res.body, expected.aResponse);
        done();
      })
    })
});
