const config = require("../config/config.json");
const assert = require("assert");
var request = require("superagent");
let fs = require("fs");
let expected = require("../testdata/expectedData.json");
let input = require("../testdata/inputData.json");
const key = fs.readFileSync("./testdata/tara_tele2_nl.key");
const cert = fs.readFileSync("./testdata/tara_tele2_nl.crt");

describe("API checks", () => {
    
    test("Verify GET", done => {
        request
            .get(config.baseURL+"api/users/2")
            .set("Content-Type", "application/json")
            .end(function(err, res) {
                res.status.should.equal(200)
                assert.deepStrictEqual(res.body, expected.theResponse);
                done()
            })
    });

    test("Verify POST Create", done => {
        request
            .post(config.baseURL+"api/users")
            .set("Content-Type", "application/json")
            .key(key)
            .cert(cert)
            .send(input.testjson)
            .end((err, res) => {
                assert.ifError(err);
                assert.deepStrictEqual(res.body, expected.theResponse);
                done();
            })
    })
});