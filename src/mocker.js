const path = require('path');
const fs = require('fs');
const raml2json = require('ramldt2jsonschema');
const dataMocker = require('./schema.js');
var _ = require('lodash');

let Mocker = function (ramlFile) {
    this.formatMap = {};
    this.ramlData = fs.readFileSync(ramlFile).toString();
    raml2json.dt2js.setBasePath(path.dirname(ramlFile));
    // let schema2 = raml2json.dt2js(ramlData, 'User');
    // console.log(ramlData);
};

Mocker.prototype = _.extend(Mocker.prototype, {
    getResponse: function (response){
        if(Array.isArray(response.type)) {

            return this.getMockData(response.type);
        } else {
            return this.getMockForObject(response.type.properties);
        }
        // if(response.type.length === 1) {
        //     console.log(this.getMockData(response.type[0]));
        // }
    },
    getMockForObject: function(object) {
        let res = {};
        for (let prop in object) {
            if(object[prop].type[0] === 'array') {
                res[prop] = [];
                for(let i = 0; i <= 25; ++i) {
                    res[prop].push(this.getMockData(object[prop].items));
                }
            } else if(object[prop].name === 'total') {
                res['total'] = 25;
            }
        }
        return res;
    },
    getMockData: function (type) {
        let schema = raml2json.dt2js(this.ramlData, type);
        schema = this.prepareSchema(schema, type);
        return dataMocker(schema);
    },

    prepareSchema(schema, type) {
        let format = this.getFormatMapByType(type);

        if (!format) {
            return schema;
        }

        if (!schema.hasOwnProperty('properties')) {
            return schema;
        }
        for (let prop in format) {
            if(schema.properties.hasOwnProperty(prop) && !schema.properties[prop].hasOwnProperty('format')){
                schema.properties[prop]['format'] = format[prop];
            }
        }

        return schema;
    },
    getFormatMapByType: function (type) {
        return this.formatMap[type];
    },
    setFormatMap: function (map) {
        this.formatMap = map;
    }
});
module.exports = Mocker;