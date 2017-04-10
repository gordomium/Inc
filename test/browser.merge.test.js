/* global describe, it, chai, inc, after */
/*eslint no-console: "ignore"*/

var merge = inc.merge;
var assert = chai.assert;
var expect = chai.expect;

var source = 'http://awp-assets.meituan.net/hfe/fep/f02c614126fe728905cb08f2ba2adb0e.js';
var target = 'http://awp-assets.meituan.net/hfe/fep/47261f16aaa5e2f6ac56c1285010f487.js'
var oldConetnt = "define('init',['util','p1'],function(){console.log('dafds init depend on uil p1 ok!'),document.write('init depend on util p2 ok!</br>')}),define('util',[],function(){console.log('ut ok!'),document.write('util ok!</br>')});sadfafds";
var newConetnt = "sdf define('init',['util','p1'],function(){console.log(' int depnd on util sdfs p1 ok 49!'),document.write('init depend on 34 util p2 ok!</br>')}),define('util',[],function(){console.log('util ok!'),document.write('il ok!</br>')});csadf";
var incData = ["sdf ", [1, 52], [57, 3], [5, 5], [63, 7], "t", [12, 2], " sdfs", [65, 6], " 49", [18, 34], " 34", [99, 65], "il", [83, 23], [124, 16], "c", [99, 3], [129, 1]];


merge.setUrl('localhost');

describe('Merge', function () {
    before(function () {
        merge.setUrl('https://f32.r.fe.dev.sankuai.com/');
        merge.setCdnUrl('http://awp-assets.sankuai.com/inc/');
    });

    beforeEach(function() {
        this.xhr = sinon.useFakeXMLHttpRequest();

        this.requests = [];
        this.xhr.onCreate = function(xhr) {
            this.requests.push(xhr);
        }.bind(this);
    });

    afterEach(function() {
        this.xhr.restore();
    });

    describe('#merge(source, target, oldConetnt, callback)', function () {
        it('403或者出错', function (done) {
            merge.merge(source, source, oldConetnt, function (str) {
                expect(str).to.equal(undefined);
                done();
            });

            this.requests[0].respond(403, {
                'Content-Type': 'application/text' 
            }, '');
        });

        it('没有历史数据&全量', function (done) {
            merge.merge('', target, '', function (str) {
                expect(str).to.equal(newConetnt);
                done();
            });

            this.requests[0].respond(200, {
                'Content-Type': 'application/text' 
            }, newConetnt);
        });

        it('增量', function (done) {
            merge.merge(source, target, oldConetnt, function (str) {
                expect(str).to.equal(newConetnt);
                done();
            });

            this.requests[0].respond(200, {
                'Content-Type': 'application/text' 
            }, JSON.stringify(incData) + '1');
        });

        it('没有变化', function (done) {
            merge.merge(source, source, oldConetnt, function (str) {
                expect(str).to.equal(oldConetnt);
                done();
            });

            this.requests[0].respond(200, {
                'Content-Type': 'application/text' 
            }, '3');
        });
    });
});
