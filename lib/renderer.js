var Canvas = require('canvas');
var fs = require('fs');
var LSystems = require('./lsystems.js').LSystems;

var HEIGHT = 512;
var WIDTH = 512;

var g_commands = "Z++X+Z+-+-++X+Z+-++Z++X+Z+-+-+-+-+Z++X+Z+-+-++X+Z+-++Z++X+Z+-+-+-+-+";
var angle = 125;
var rules = ['X=Z+', 'Y=+', 'Z=X+Z+--'];
var sampleID = "238fd7cd-4eb9-44b0-9309-05536026c909";
var axiom = "XX";
var iterations = 5;
var constants = '';

var g_renderer;

var AWS = require('aws-sdk');
AWS.config.update({region: 'eu-west-1'});
AWS.config.setPromisesDependency(require('bluebird'));

var s3 = new AWS.S3();

var canvasToS3 = function (id, canvas) {
  var params = {Bucket: 'hackmtyaug16-bigben-lsystems', Key: id+".png", Body: canvas.toBuffer()};
  return s3.putObject(params).promise().catch( function(err) {
    console.log(err);
  });
};

var CONTEXT;

function calcOffsets()
{
   try
   {
      // calc offset bounding box before render
      g_renderer = new LSystems.TurtleRenderer(WIDTH, HEIGHT);
      g_renderer.setAngle(angle);
      g_renderer.setConstants('');
      g_renderer.setRenderLineWidths(false);
      g_renderer.process(g_commands, false);
      
      updateStatus("Calculated boundry. Rendering...", renderCmds);
   }
   catch (e)
   {
      console.log("Error during TurtleRenderer.process()\n" + e);
   }
}

function renderCmds()
{
   try
   {
      // calc new distance based on screen res
      var oldDistance = 10.0;
      var newDistance;
      var dim = g_renderer.getMinMaxValues();;
      if (dim.maxx - dim.minx > dim.maxy - dim.miny)
      {
         // X has the largest delta - use that
         newDistance = (WIDTH / (dim.maxx - dim.minx)) * oldDistance;
      }
      else
      {
         // Y has the largest delta - use that
         newDistance = (HEIGHT / (dim.maxy - dim.miny)) * oldDistance;
      }
      
      // calc rendering offsets
      
      // scale min/max values by new distance
      dim.minx *= (newDistance / oldDistance);
      dim.maxx *= (newDistance / oldDistance);
      dim.miny *= (newDistance / oldDistance);
      dim.maxy *= (newDistance / oldDistance);
      
      var xoffset = (WIDTH / 2) - (((dim.maxx - dim.minx) / 2) + dim.minx);
      var yoffset = (HEIGHT / 2) - (((dim.maxy - dim.miny) / 2) + dim.miny);
      
      // reprocess...
      g_renderer.setOffsets(xoffset, yoffset);
      g_renderer.setAngle(angle);
      g_renderer.setDistance(newDistance);
      
      // completed
      var canvas = g_renderer.process(g_commands, true);

      canvasToS3(sampleID, canvas).then( function () {
        console.log('Done!')
        CONTEXT.succeed();
      });
      
   }
   catch (e)
   {
      console.log("Error during TurtleRenderer.process(draw)\n" + e);
   }
}

var render = function(event, context) {

    console.log('Rendering ' +  JSON.stringify(event));
    g_commands = event.g_commands;
    angle = Number(event.angle);
    sampleID = event.id;

    CONTEXT = context;

    calcOffsets();

};

function updateStatus(msg, fn)
{
   console.log(msg);
   if (fn)
   {
      setTimeout(fn, 0);
   }
}

module.exports.render = render;
