var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose')
var debug = require('debug')('ppc:server');
var async = require("async");
var Tree = require("../models/tree");
var Nodo = require("../models/node");
var childProcess = require("child_process");
var fs = require('fs');
var os = require('os')

var router = express.Router();

var ancestors = [], nodes = [], index = 0, node = {}, inserted = 0, performance, CPUS = os.cpus().length, running = [];

//Connect to Mongoose
mongoose.createConnection('mongodb://localhost:27017/ppc?socketTimeoutMS=60000000&connectTimeoutMS=60000000&poolSize=100&journal=false', {
  journal: false,
  timeout: false,
  server: {
    socketOptions: {
      connectionTimeoutMS: 600000000,
      socketTimeoutMS: 600000000
    }
  }
});

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({"extended" : false}));


router.get("/test",function(req,res){
	console.time("perf2")
	//res.json(mongoose.connection.server);
	//simulateMillions();
	simulateInsertR(0);
	//simulateInsert();
})

//create a file for each create request
router.post("/", function(req, res) {
	console.time("perf")
	console.time("perf2")
	console.log(req.body)
	performance = Date.now();

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

	  	//la funzione random prende k come valore più piccolo
	  	//nel caso sia più grande i valori vengono scambiati
	  	//in modo tale da evitare risultati sbagliati
	  	if(temp.k > temp.n){
	  		//swap
	  		temp.n = [temp.k, temp.k = temp.n][0];
	  	}

	  	
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
		//console.log(data)
		t.id = data._id;

		//send result
		res.json(t);

		//if everything is ok create file in the folder
		fs.writeFile('functions/creating/' + t.id + Date.now() + ".json", JSON.stringify(t), function(err) {
		    if (err) throw err;
		    //check if there are trees in queue
		    checkTrees()
		})
	})
  
});

//check trees overy minutes
//setInterval(checkTrees, 60000)

//check if there are trees in queue
function checkTrees(){

  if(running.length == CPUS){
  	console.log("request has been put in queue")
  	return false;
  }

  fs.readdir('functions/creating', function(err, files) {
  	//console.log(files)
    if (err) throw console.log('Errore1: ' + err);
    if (files.length > 0) {
      try {
      	//controllare DS_STORE su Mac e thumb.db su Windows
        var file_content = fs.readFileSync('functions/creating/' + files[0]);
        build_tree(file_content);
        fs.unlink('functions/creating/' + files[0]);
      } catch(err) {
        console.log('Errore2: ' + err)
      }
    }
  });
}


function build_tree(json_data) {
  	t = JSON.parse(json_data)
  	//CREATE NODES
	console.log("building tree...")
	// Do work  (in this case just up-case the string
	Tree.updateTree({id: t.id, perf: "Building..."}, function(err, data){
		console.log(data)
	});
	var child = childProcess.fork("./functions/build")
	running.push(child)
	child.send(t);
	child.on('message', function(m) {
	  // Receive results from child process
	  console.log('process ended and check new trees; received: ' + m);
	  running.pop()
	  checkTrees();
	});
  	
}


//OLD BUILD // change get with post = router.post("/",function(req,res){
router.get("/",function(req,res){
	console.time("perf")
	console.time("perf2")
	console.log(req.body)
	performance = Date.now();

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

	  	//la funzione random prende k come valore più piccolo
	  	//nel caso sia più grande i valori vengono scambiati
	  	//in modo tale da evitare risultati sbagliati
	  	if(temp.k > temp.n){
	  		//swap
	  		temp.n = [temp.k, temp.k = temp.n][0];
	  	}

	  	
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
		//console.log(data)
		t.id = data._id;

		//send result
		res.json(t);

		//CREATE NODES
		console.log("building tree...")
		var child = childProcess.fork("./functions/build")
		child.send(t);
		child.on('message', function(m) {
		  // Receive results from child process
		  console.log('received: ' + m);
		});
		//buildTree(0, t, t.splitSize, t.depthSize, 0, setAttributesValues(t.vertecesAttributeList), setAttributesValues(t.edgesAttributeList));

	})


    //res.json("ok");
});



/* GET users listing. 
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
*/


module.exports = router;