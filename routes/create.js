var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose')
var debug = require('debug')('ppc:server');
var mongoOp = require("../models/mongo");

var router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({"extended" : false}));


//This function generates floating-point between two numbers low (inclusive) and high (exclusive) ([low, high))
var random = function(low, high) {
    return Math.random() * (high - low) + low;
};

//This function generates random integer between two numbers low (inclusive) and high (exclusive) ([low, high))
var randomInt = function(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
};

//Connect to Mongoose
mongoose.createConnection('mongodb://localhost:27017/ppc');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
});

router.post("/",function(req,res){
	//da spostare su client
	var totale = Math.pow(2, req.body.depthSize+1) - 1;
	//costruzione albero
	var tree = {
		"name": req.body.nameTree,
		"splitSize": req.body.splitSize,
		"depthSize": req.body.depthSize,
		"total": totale,
		"creation": new Date(),
		"lastOperation": null
	};

	var vertecesAttributeList = [], edgesAttributeList = [];
	var isIntegerV = JSON.parse(req.body['isIntegerV[]']);
	var isIntegerE = JSON.parse(req.body['isIntegerE[]']);
	
	debug(tree.name)

	//ATTRIBUTE FOR NODES
	for (var i = 0, len = req.body['vertexAttrName[]'].length; i < len; i++) {
		var temp = {};
		temp.name = req.body['vertexAttrName[]'][i];
	  	temp.ref = "Node";
	  	//per il momento la funzione di generazione valori è statica
	  	//temp.ref = req.body.vertexGenerationRule[i];
	  	temp.k = req.body['kValueVertex[]'][i];
	  	temp.n = req.body['nValueVertex[]'][i];
	  	temp.isInteger = isIntegerV[i];
	  	vertecesAttributeList.push(temp);

	}

	//ATTRIBUTE FOR EDGES
	for (var i = 0, len = req.body['edgeAttrName[]'].length; i < len; i++) {
		var temp = {};
		temp.name = req.body['edgeAttrName[]'][i];
	  	temp.ref = "Node";
	  	//per il momento la funzione di generazione valori è statica
	  	//temp.ref = req.body.vertexGenerationRule[i];
	  	temp.k = req.body['kValueEdge[]'][i];
	  	temp.n = req.body['nValueEdge[]'][i];
	  	temp.isInteger = isIntegerE[i];
	  	edgesAttributeList.push(temp);

	}

	tree.vertecesAttributeList = vertecesAttributeList;
	tree.edgesAttributeList = edgesAttributeList;

	//CREATE NODES
	

    res.json(tree);
    //res.json("ok");
});

/* GET users listing. 
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
*/


module.exports = router;