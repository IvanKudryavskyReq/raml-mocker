const osprey = require('osprey');
const mockerRequestGenerator = require('./index');
const Mocker = require('./mocker');
let _ = require('lodash');

let MockServer = function (ramlFile) {
    this.ramlFile = ramlFile;
    this.mocker = new Mocker(ramlFile);
    this.app = {};
};
MockServer.prototype =_.extend(MockServer.prototype, {
    init: function (app, port) {
        this.app = app;
        osprey.loadFile(this.ramlFile)
            .then(function (middleware) {
                app.use(middleware);
                app.use(function (err, req, res, next) {
                    res.status(500).send(err);
                });

                app.listen(port);
            })
            .catch(function(e) { console.error("Error: %s", e.message); });

        mockerRequestGenerator.generate({files: [this.ramlFile]}, this.callbackMock.bind(this));
    },
    setUrlHandler: function(reqToMock) {
        let handler = function(req,res) {
            let code = reqToMock.method === 'post' ? 201 : 200;
            let response = reqToMock.getResponseTypeByCode(code);

            res.status(code).send(this.mocker.getResponse(response));
        };
        this.app[reqToMock.method](reqToMock.uri, handler.bind(this));
    },
    callbackMock: function (requestsToMock) {
        requestsToMock.forEach(this.setUrlHandler.bind(this));
    }
});

module.exports = MockServer;