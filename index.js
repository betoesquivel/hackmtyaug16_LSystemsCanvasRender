//var render = require('./lib/renderer.js').render;
var Canvas = require('canvas');

var AWS = require('aws-sdk');
AWS.config.update({region: 'eu-west-1'});
AWS.config.setPromisesDependency(require('bluebird'));

var render = require('./lib/renderer.js').render;

var handler = function(event, context) {

    render(event, context);

}

module.exports.handler = handler;
