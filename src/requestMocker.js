'use strict';
var _ = require('lodash');
var RequestMocker = function (uri, method) {
    this.uri = uri;
    this.method = method;
    this.responses = {};
    this.responseTypes = {};
    this.examples = {};
};
RequestMocker.prototype = _.extend(RequestMocker.prototype, {
    mockByCode: function (code) {
        if (!_.isUndefined(this.responses[code])) {
            return this.responses[code]();
        } else {
            throw 'Code not defined in responses';
        }
    },
    exampleByCode: function (code) {
        if (!_.isUndefined(this.examples[code])) {
            return this.examples[code]();
        } else {
            throw 'Code not defined in examples';
        }
    },
    getResponseTypeByCode: function(code){
        return this.responseTypes[code];

    },
    addResponseType: function(code, responseType){
        return this.responseTypes[code] = responseType;

    },
    getResponses: function () {
        return this.responses;
    },
    getExamples: function () {
        return this.examples;
    },
    addResponse: function(code, exampleAndMockObj) {
        this.responses[code] = exampleAndMockObj;
    }
});

module.exports = RequestMocker;
