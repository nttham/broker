/**
 * Created by 423919 on 6/17/2016.
 */
var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var expect = require('chai').expect;
//var request = require('supertest');
var server = require('./push-service-broker.js');
chai.use(chaiHttp);

/**
 * Test Suites
 */



describe('AuthService Broker Listening on 8080', function () {
    // Start the server before the test case with delay of 1second to instantiate the routers
    before(function (done) {
        this.request = chai.request(server);
        setTimeout(function () {
            done();
        }, 1000);
    });


    describe('get catalog', function () {
        it('should be able to get the catalog of the service broker', function (done) {
            this.timeout(15000);
            this.request.get('/v2/catalog')
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.should.have.property('text');

                    done();
                });
        });
    });

    describe('create-service instance put method', function () {
        it('should be able to provision the service instance ', function (done) {
            this.timeout(15000);

            this.request.put("/v2/service_instances/a9bc36abea045066cd4be131e278ff80")
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.should.have.property('text');
                    var out = JSON.parse(res.text);
                    out.should.have.property('description');
                    done();
                });


        });
    });

    describe('create-bind-service instance put method', function () {
        it('should be able to bind the service instance ', function (done) {
            this.timeout(15000);

            this.request.put("/v2/service_instances/a9bc36abea045066cd4be131e278ff80/service_bindings/kUomrXzdex8PfY3e")
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .end(function (err, res) {
                    res.should.have.status(201);
                    res.should.have.property('text');
                    var out = JSON.parse(res.text);
                    out.should.have.property('credentials');
                    done();
                });


        });
    });


    describe('create-unbind-service instance DELETE method', function () {
        it('should be able to unbind the service instance ', function (done) {
            this.timeout(15000);
             this.request.delete("/v2/service_instances/a9bc36abea045066cd4be131e278ff80/service_bindings/kUomrXzdex8PfY3e")

                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .end(function (err, res) {
                    res.should.have.status(200);
                    done();
                });


        });
    });

    describe('delete-service instance DELETE method', function () {
        it('should be able to delete the service instance ', function (done) {
            this.timeout(15000);

            this.request.delete("/v2/service_instances/a9bc36abea045066cd4be131e278ff80")

                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .end(function (err, res) {
                    res.should.have.status(200);
                    done();
                });


        });
    });

});