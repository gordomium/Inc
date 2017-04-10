/* global describe, it, chai, inc, after */
/*eslint no-console: "ignore"*/

var assert = chai.assert;
var expect = chai.expect;

describe('In', function () {
    before(function () {
        inc.config('bizname', 'test');
        inc.config('isStore', true);
        inc.config('serverUrl', 'https://f32.r.fe.dev.sankuai.com/');
        inc.config('cdnUrl', 'http://awp-assets.sankuai.com/inc/');
    });

    after(function () {
        // runs after all tests in this block
        var coverage = window.__coverage__;

        if (coverage) {
            console.log(JSON.stringify(coverage));
        } else {
            console.log('No coverage data generated');
        }
    });

    beforeEach(function() {
        this.xhr = sinon.useFakeXMLHttpRequest();

        this.requests = [];
        this.xhr.onCreate = function(xhr) {
            this.requests.push(xhr);
        }.bind(this);

        inc.config('isStore', true);
    });


    afterEach(function() {
        this.xhr.restore();

        // clear
        window.mod11 = undefined;
        window.mod1 = undefined;
        window.mod2 = undefined;
        window.mod3 = undefined;
        window.mod4 = undefined;
        window.mod5 = undefined;

        window.localStorage.clear();
    });

    describe('#add(name, path)', function () {
        it('should added special module successful', function (done) {
            inc.add('mod1.1', './modules/mod1.1.js');
            inc.use('mod1.1', function () {
                expect(window.mod11).to.equal(true);
                done();
            });

            this.requests[0].respond(200, {
                'Content-Type': 'application/javascript' 
            }, 'window.mod11 = true;');
        });

        it('should added special module error', function (done) {
            inc.add('mod1', './modules/mod1.js');
            inc.use('mod1', function () {
                expect(window.mod1).to.equal(true);
                done();
            });

            this.requests[0].respond(404, {}, '');
        });
    });

    describe('#add(name, object) - without dependency', function () {
        it('should added special module successful', function (done) {
            inc.config('isStore', false);
            inc.add('mod2', { path: './modules/mod2.js', type: 'js', charset: 'utf-8' });
            inc.use('mod2', function () {
                expect(window.mod2).to.equal(true);
                done();
            });
        });
    });

    describe('#add(name, object) - with dependency', function () {
        it('should added special module successful', function (done) {
            inc.add('mod3', { path: './modules/mod3.js', type: 'js', charset: 'utf-8'});
            inc.add('mod4', { path: './modules/mod4.js', type: 'js', charset: 'utf-8', rely: ['mod3'] });
            inc.use('mod4', function () {
                expect(window.mod3).to.equal(true);
                expect(window.mod4).to.equal(true);
                done();
            });

            this.requests[0].respond(200, {
                'Content-Type': 'application/javascript' 
            }, 'window.mod3 = true;');

            this.requests[1].respond(200, {
                'Content-Type': 'application/javascript' 
            }, 'window.mod4 = true;');
        });
    });

    describe('#add(param) - missing parameters', function () {
        it('should added special module failed', function (done) {
            inc.add('mod5');
            inc.use('mod5', function () {
                console.log(window.mod5);
                expect(window.mod5).to.equal(undefined);
                done();
            });
        });
    });

    describe('#adds()', function () {
        it('should added special module successful', function (done) {
            inc.adds({
                modules: {
                    'mod5': './modules/mod5.js',
                    'mod6': { path: './modules/mod6.js', type: 'js', charset: 'utf-8', rely: ['mod5'] }
                }
            });
            inc.use('mod6', function () {
                expect(window.mod5).to.equal(true);
                expect(window.mod6).to.equal(true);
                done();
            });

            this.requests[0].respond(200, {
                'Content-Type': 'application/javascript' 
            }, 'window.mod5 = true;');

            this.requests[1].respond(200, {
                'Content-Type': 'application/javascript' 
            }, 'window.mod6 = true;');
        });

        it('should proxy special module successful', function (done) {
            inc.adds({
                modules: {
                    'mod7': { path: 'http://awp-assets.meituan.net/hfe/fep/4b09cc8ed81fac37b0eaa7f00b6effca.js', version: '1.0', type: 'js', charset: 'utf-8' }
                }
            });
            inc.use('mod7', function () {
                expect(window.mod7).to.equal(true);
                done();
            });

            this.requests[0].respond(200, {
                'Content-Type': 'application/javascript' 
            }, 'window.mod7 = true;');
        });

        it('should store special module successful', function (done) {
            window.localStorage.setItem('test:mod7', '{"u":"http://awp-assets.meituan.net/hfe/fep/4b09cc8ed81fac37b0eaa7f00b6effca.js","v":"1.0","c":"window.mod7 = true;"}');
            inc.adds({
                modules: {
                    'mod7': { path: 'http://awp-assets.meituan.net/hfe/fep/4b09cc8ed81fac37b0eaa7f00b6effca.js', version: '1.0', type: 'js', charset: 'utf-8' }
                }
            });
            inc.use('mod7', function () {
                expect(window.mod7).to.equal(true);
                done();
            });
        });

        it('should increment special module successful', function (done) {
            window.localStorage.setItem('test:mod8', '{"u":"http://awp-assets.meituan.net/hfe/fep/4b09cc8ed81fac37b0eaa7f00b6effca.js","v":"1.0","c":"window.mod7 = true;"}');
            inc.adds({
                modules: {
                    'mod8': { path: 'http://awp-assets.meituan.net/hfe/fep/664dc864ececfda55dbda00c59ca0722.js', version: '2.0', type: 'js', charset: 'utf-8' }
                }
            });
            inc.use('mod8', function () {
                expect(window.mod8).to.equal(true);
                done();
            });

            this.requests[0].respond(200, {
                'Content-Type': 'text/json' 
            }, JSON.stringify([[1,10], '8',[11,8]]) + '1');
        });
    });
});
