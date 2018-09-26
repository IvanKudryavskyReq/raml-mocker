const path = require('path');
const fs = require('fs');
const raml2json = require('ramldt2jsonschema');
const dataMocker = require('./schema.js');
let _ = require('lodash');

let Mocker = function (ramlFile) {
    this.formatMap = {};
    this.ramlData = fs.readFileSync(ramlFile).toString();
    this.schemaCache = {};
    raml2json.dt2js.setBasePath(path.dirname(ramlFile));
    this.customFormats = {};
};

Mocker.prototype = _.extend(Mocker.prototype, {
    getResponse: function (response) {
        if(Array.isArray(response.type)) {
            return this.getMockData(response.type);
        } else {
            return this.getMockForObject(response.type.properties);
        }
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
        return dataMocker(this.getSchema(type), this.customFormats);
    },
    getSchema: function(type) {
        if(this.schemaCache[type]) {
            return this.schemaCache[type];
        }
        let schema = raml2json.dt2js(this.ramlData, type);
        schema.properties = this.prepareSchema(schema.properties, type[0]);
        this.schemaCache[type] = schema;
        return schema;
    },
    prepareSchema(schemaProperties, type) {
        let format = this.getFormatMapByType(type);

        for (let prop in schemaProperties) {
            if(schemaProperties[prop].type === 'object') {
                schemaProperties[prop].properties = this.prepareSchema(schemaProperties[prop].properties, prop);
            } else {
                if(format
                    && format.hasOwnProperty(prop)
                    && !schemaProperties[prop].hasOwnProperty('format')
                ){
                    schemaProperties[prop]['format'] = format[prop];
                }
            }

        }

        return schemaProperties;
    },
    getFormatMapByType: function (type) {
        // if(typeof type === 'object')
        return this.formatMap[type.toLowerCase()];
    },
    setFormatMap: function (map) {
        this.formatMap = map;
    },
    setCustomFormats: function (formats) {
        this.customFormats = formats;
    }
});
module.exports = Mocker;