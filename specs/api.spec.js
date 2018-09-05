const config = require('../config/config.json');
const assert = require('assert');
const should = require('should');
var request = require('superagent');
let fs = require('fs');
let expected = require('../testdata/expectedData.json');
let input = require('../testdata/inputData.json');
const key = fs.readFileSync('./testdata/tara_tele2_nl.key');
const cert = fs.readFileSync('./testdata/tara_tele2_nl.crt');

describe('Healthcheck Tara API', () => {
    
    test('Healthcheck Tara API', done => {
        request
        .get(config.baseURL+'health')
        .set('Content-Type', 'application/json')
        .end(function(err, res) 
        {
            res.status.should.equal(200)
            done()
        })
    });

    test('Verify Tara API response', done => {
        request
      .post(config.baseURL+'v1/messages')
      .set('Content-Type', 'application/json')
      .key(key)
      .cert(cert)
      .send(input.testTara)
      .end((err, res) => {
        assert.ifError(err);
        assert.deepStrictEqual(res.body, expected.taraResponse);
        done();
      })
    })
});