const config = require('../config/config.json');
const assert = require('assert');
var request = require('superagent');
let fs = require('fs');
let expected = require('../testdata/expectedData.json');
let input = require('../testdata/inputData.json');
// const key = fs.readFileSync('./testdata/xxxx.key');
// const cert = fs.readFileSync('./testdata/xxxx.crt');

describe('Healthcheck API', () => {
    
    test('GET API test', done => {
        request
        .get(config.baseURL+'users')
//      .key(key)
//      .cert(cert)
        .set('Content-Type', 'application/json')
        .end(function(err, res) 
        {
            assert.strictEqual(res.statusCode, 200);
            done()
        })
    });

    test('POST API test', done => {
        request
      .post(config.baseURL+'users')
//    .key(key)
//    .cert(cert)
      .set('Content-Type', 'application/json')
      .send(input.createUser)
      .end(function(err, res)
      {
        assert.strictEqual(res.statusCode, 201);
        assert.equal(res.job, expected.job);
        assert.equal(res.name, expected.name);
        done();
      })
    })
});
