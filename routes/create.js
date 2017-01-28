var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose')
var debug = require('debug')('ppc:server');

var Tree = require("../models/tree");
var Nodo = require("../models/node");

var router = express.Router();

//Connect to Mongoose
mongoose.createConnection('mongodb://localhost:27017/ppc', {
  server: {
    socketOptions: {
      socketTimeoutMS: 0,
      connectTimeoutMS: 0
    }
  }
});

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({"extended" : false}));

//This function generates floating-point between two numbers low (inclusive) and high (exclusive) ([low, high))
var random = function(low, high) {
	var number = Math.random() * (high - low) + low;
	console.log(number, low, high)
    return parseFloat(number).toFixed(2);
};

//This function generates random integer between two numbers low (inclusive) and high (exclusive) ([low, high))
var randomInt = function(low, high) {
	var number = Math.floor(Math.random() * (high - low) + low)
	console.log(number, low, high)
    return number;
};

//GENERATE ATTRIBUTES VALUES FUNCTION
function setAttributesValues(list){
	//list is the array of attributes
	var attributesValues = [];

	for (var i = 0, len = list.length; i < len; i++) {
		var obj = {};
		if(list[i].isInteger == 1){
			obj.value = randomInt(list[i].k, list[i].n);
		}else{
			obj.value = random(list[i].k, list[i].n);
		}
		obj.name = list[i].name
		attributesValues.push(obj)
	}

	return attributesValues;
}


//BUILDTREE FUNCTION
//var nodes = [];
var anchestors = [];
var index = 0;
var buildTree = function buildTreeRecursive(key, albero, split, depth, ant, k){
	var node = {
		"seq_number": key,
		"tree_id": albero.id,
		"name": "Vertex_" + key,
		"level": k,
		"attributes": setAttributesValues(albero.vertecesAttributeList),
		"edge": {
			"id_edge": "edge_" + key,
			"attributes": setAttributesValues(albero.edgesAttributeList),

		},
		"ancestors": ant.slice(0)
	}
	//simulate insert
	//nodes.push(node); index++;

	//INSERT NODE
	//nodes.push(node);
	Nodo.createNode(node, function(err, data){
		if(err){
			throw err;
			//annullare operazione e cancellare l'albero appena inserito
		}
		console.log(data.ops[0].seq_number)
	})

	index++;
		
	//CASO FOGLIA
	if (k == depth){
		return;
	}

	//CASO FIGLI
	delete node.anchestors;
	//anchestors.unshift(node)
	anchestors.push(node)
	for(var i = 0; i < split; i++){
		buildTreeRecursive(index, albero, split, depth, anchestors, k+1)
		if(i == split-1){
			anchestors.pop();
			//anchestors.shift()
	    }
	}
	
	
}

router.post("/",function(req,res){
	console.time("perf")
	anchestors = [];
	index = 0;
	//NEW TREE
	var t = {
		"name": req.body.nameTree,
		"splitSize": req.body.splitSize,
		"depthSize": req.body.depthSize,
		"total": req.body.total,
		"creation": new Date(),
		"lastOperation": null
	};


	var vertecesAttributeList = [], edgesAttributeList = [];
	var isIntegerV = JSON.parse(req.body['isIntegerV[]']);
	var isIntegerE = JSON.parse(req.body['isIntegerE[]']);
	//ATTRIBUTES FOR NODES
	if( typeof req.body['vertexAttrName[]'] === 'string' ) {
    	req.body['vertexAttrName[]'] = [ req.body['vertexAttrName[]'] ];
	}
	if( typeof req.body['nValueVertex[]'] === 'string' ) {
    	req.body['nValueVertex[]'] = [ req.body['nValueVertex[]'] ];
	}
	if( typeof req.body['kValueVertex[]'] === 'string' ) {
    	req.body['kValueVertex[]'] = [ req.body['kValueVertex[]'] ];
	}
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

	//ATTRIBUTES FOR EDGES
	if( typeof req.body['edgeAttrName[]'] === 'string' ) {
    	req.body['edgeAttrName[]'] = [ req.body['edgeAttrName[]'] ];
	}
	if( typeof req.body['kValueEdge[]'] === 'string' ) {
    	req.body['kValueEdge[]'] = [ req.body['kValueEdge[]'] ];
	}
	if( typeof req.body['nValueEdge[]'] === 'string' ) {
    	req.body['nValueEdge[]'] = [ req.body['nValueEdge[]'] ];
	}
	for (var i = 0, len = req.body['edgeAttrName[]'].length; i < len; i++) {
		var temp = {};
		temp.name = req.body['edgeAttrName[]'][i];
	  	temp.ref = "Edge";
	  	//per il momento la funzione di generazione valori è statica
	  	//temp.ref = req.body.vertexGenerationRule[i];
	  	temp.k = parseFloat(req.body['kValueEdge[]'][i]);
	  	temp.n = parseFloat(req.body['nValueEdge[]'][i]);
	  	temp.isInteger = isIntegerE[i];
	  	edgesAttributeList.push(temp);

	}
	t.vertecesAttributeList = vertecesAttributeList;
	t.edgesAttributeList = edgesAttributeList;
	//INSERT TREE
	Tree.createTree(t, function(err, data){
		if(err){
			throw err;
		}
		t.id = data._id;
		//CREATE NODES
		buildTree(0, t, t.splitSize, t.depthSize, [], 0);
		res.json(t);
		//res.json("ok");
	})


    //res.json("ok");
});



/* GET users listing. 
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
*/


module.exports = router;