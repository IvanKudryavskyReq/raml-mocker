const osprey = require('osprey');
const mockerRequestGenerator = require('./index');
const Mocker = require('./mocker');
let _ = require('lodash');

let MockServer = function (ramlFile) {
    this.ramlFile = ramlFile;
    this.mocker = new Mocker(ramlFile);
    this.app = {};
    this.errorHandler = null;
    this.initCallback = null;
};
MockServer.prototype =_.extend(MockServer.prototype, {
    init: function (app, port) {
        this.app = app;

        const ramlConfig = {
            "disableErrorInterception": true
        };

        let errorCallback = function (err, req, res, next) {
            if(this.errorHandler) {
                this.errorHandler(err, req, res, next);
            }
            if(err.ramlNotFound) {
                res.status(err.statusCode).send();
            }
            res.status(500).send(err);
        };

        let ramlParseCallback = function (middleware) {
            app.use(middleware);
            app.use(errorCallback.bind(this));
            app.listen(port);
            if (this.initCallback) {
                this.initCallback();
            }
        };

        osprey.loadFile(this.ramlFile, ramlConfig)
            .then(ramlParseCallback.bind(this))
            .catch(function(e) {
                // console.error("Error: %s", e.message);
            });

        mockerRequestGenerator.generate({files: [this.ramlFile]}, this.callbackMock.bind(this));
    },
    setInitCallback: function(initCallback) {
        this.initCallback = initCallback;
    },
    setErrorHandler: function(handler) {
        this.errorHandler = handler;
    },
    setUrlHandler: function(reqToMock) {
        let handler = function(req,res) {
            let response = reqToMock.getResponseTypeByCode(reqToMock.successCode);
            if(response.type === null) {
                response = "";
            } else {
                response = this.mocker.getResponse(response);
            }
            res.status(reqToMock.successCode).send(response);
        };
        this.app[reqToMock.method](reqToMock.uri, handler.bind(this));
    },
    callbackMock: function (requestsToMock) {
        requestsToMock.forEach(this.setUrlHandler.bind(this));
    }
});

module.exports = MockServer;
