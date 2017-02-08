var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose')
var debug = require('debug')('ppc:server');
var async = require("async");
var Tree = require("../models/tree");
var Nodo = require("../models/node");

var router = express.Router();

var ancestors = [], nodes = [], index = 0, node = {}, inserted = 0;

//Connect to Mongoose
mongoose.createConnection('mongodb://localhost:27017/ppc?socketTimeoutMS=60000000&connectTimeoutMS=60000000&poolSize=3&journal=false', {
  journal: false,
  server: {
    socketOptions: {
      connectionTimeoutMS: 600000000,
      socketTimeoutMS: 600000000
    }
  }
});

//var bulk = mongoose.connection.db.collection('nodes').initializeUnorderedBulkOp();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({"extended" : false}));

//This function generates floating-point between two numbers low (inclusive) and high (exclusive) ([low, high))
var random = function(low, high) {
	var number = Math.random() * (high - low) + low;
	//console.log(number, low, high)
    return parseFloat(number).toFixed(2);
};

//This function generates random integer between two numbers low (inclusive) and high (exclusive) ([low, high))
var randomInt = function(low, high) {
	var number = Math.floor(Math.random() * (high - low) + low)
	//console.log(number, low, high)
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
router.get("/test",function(req,res){
	console.time("perf2")
	//res.json(mongoose.connection.server);
	//simulateMillions();
	simulateInsertR(0);
	//simulateInsert();
})
router.post("/",function(req,res){
	console.time("perf")
	console.time("perf2")
	ancestors = [];
	index = 0;
	node = {};
	nodes.length = 0;
	inserted = 0;

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
		//console.log(data)
		t.id = data._id;
		res.json(t);

		//CREATE NODES
		console.log("building tree...")
		buildTree(0, t, t.splitSize, t.depthSize, 0, setAttributesValues(t.vertecesAttributeList), setAttributesValues(t.edgesAttributeList));

	})


    //res.json("ok");
});


//BUILDTREE FUNCTION
var buildTree1 = function buildTreeRecursive1(key, albero, split, depth, ant, k, vatt, eatt){

	console.log("chiamata: "+ index)
	        Nodo.createNode({
					"seq_number": index,
					"tree_id": albero.id,
					"name": "Vertex_" + index,
					"level": k,
					"attributes": vatt.slice(0),
					"edge": {
						"id_edge": "edge_" + key,
						"attributes": eatt.slice(0),

					},
					"ancestors": ant.slice(0)
				}, function(err, data){
				if(err){
					console.log(err)
					//throw err;
					//annullare operazione e cancellare l'albero appena inserito
				}
				inserted++;
				console.log("inserito: "+inserted)
				if(inserted == albero.total){
					console.timeEnd("perf2")
				}else{
					//index++;
					//CASO FOGLIA
					if (k == depth){
						if(inserted == albero.total){
							console.timeEnd("perf")
						}
						return;
					}

					//CASO FIGLI
					ancestors.unshift({
						"seq_number": index,
						"name": "Vertex_" + index,
						"level": k,
						"attributes": vatt.slice(0),
						"edge": {
							"id_edge": "edge_" + index,
							"attributes": eatt.slice(0)
						}

					});
					//ancestors.push(node)

					async.times(split, function(n, next_father){
					  	buildTreeRecursive(index, albero, split, depth, ancestors, k+1, setAttributesValues(albero.vertecesAttributeList), setAttributesValues(albero.edgesAttributeList))
						if(n == split-1){
							//ancestors.pop();
							ancestors.shift()
					    }

					}, function(err, res) {
					  // it's done
					});
				}
			})
		index++;
	        
	
}


//BUILDTREE FUNCTION
var buildTree = function buildTreeRecursive(key, albero, split, depth, k, vatt, eatt){
	//console.log("chiamata ricorsiva: "+ key + " - nodes: " + nodes.length)
	if(nodes.length == 10000){
		console.log("chiamata ricorsiva: "+ key)
		Nodo.collection.insert(nodes.slice(0), {  writeConcern: { wtimeout: 0 }, ordered: false }, function(err, data){

			if(err){
				throw err;
			}
			inserted++;
			console.log("inserito: "+ data.ops[0].seq_number + " - n: " + inserted)

		})
	nodes.length = 0;
	}else{
		nodes.push({
			"seq_number": key,
			"tree_id": albero.id,
			"name": "Vertex_" + key,
			"level": k,
			"attributes": vatt.slice(0),
			"edge": {
				"id_edge": "edge_" + key,
				"attributes": eatt.slice(0),

			},
			"ancestors": ancestors.slice(0)
		})
	}
	

	index++;
	//CASO FOGLIA
	if (k == depth){
		if(index == albero.total){
			console.timeEnd("perf")
			Nodo.collection.insert(nodes.slice(0), {  writeConcern: { wtimeout: 0 }, ordered: false }, function(err, data){
			if(err){
				throw err;
			}
			inserted++;
			console.log("last: "+ data.ops[0].seq_number + " - n: " + inserted)
			console.timeEnd("perf2")
			})

		}
		return;
	}

	//CASO FIGLI
	//delete node.ancestors;
	//ancestors.push(node)
	ancestors.unshift({
		"seq_number": key,
		"name": "Vertex_" + key,
		"level": k,
		"attributes": vatt.slice(0),
		"edge": {
			"id_edge": "edge_" + key,
			"attributes": eatt.slice(0)
		}

	});
	for(var i = 0; i < split; i++){
		buildTreeRecursive(index, albero, split, depth, k+1, setAttributesValues(albero.vertecesAttributeList), setAttributesValues(albero.edgesAttributeList))
		if(i == split-1){
			//ancestors.pop();
			ancestors.shift()
	    }
	}

}
var insertNode = function(node, total){
	console.log("chiamata: "+node.seq_number)
	Nodo.createNode(node, function(err, data){
		if(err){
			console.log(err)
			//throw err;
			//annullare operazione e cancellare l'albero appena inserito
		}
		inserted++;
		console.log("inserito: "+inserted)
		if(inserted == total){
			console.timeEnd("perf2")
			//bulk.execute(function(err, result) {
		    //   if(err){
		    //   	console.log(err)
		    //   }
		    //   console.timeEnd("perf2")
		    //   console.log("inseriti")
		    //   //db.close();
		    // });
		}
	})
}


//BUILDTREE FUNCTION
var buildTreeAlt = function buildTreeRecursiveSimple(key, albero, split, depth, k, vatt, eatt){
	//simulate insert
	//nodes.push(node); index++;

	//INSERT NODE
	//nodes.push(node);
	console.log(index)
	//bulk.insert(node)
	Nodo.createNode({
			"seq_number": key,
			"tree_id": albero.id,
			"name": "Vertex_" + key,
			"level": k,
			"attributes": vatt.slice(0),
			"edge": {
				"id_edge": "edge_" + key,
				"attributes": eatt.slice(0),

			},
			"ancestors": ancestors.slice(0)
		}, function(err, data){
		if(err){
			console.log(err)
			throw err;
			//annullare operazione e cancellare l'albero appena inserito
		}
		inserted++;
		console.log("inserito: "+inserted)
		if(inserted == albero.total){
			console.timeEnd("perf2")
		}
	})

	index++;

	//CASO FOGLIA
	if (k == depth){
		if(index == albero.total){
			console.timeEnd("perf")
		}
		return;
	}

	//CASO FIGLI
	ancestors.unshift({
			"seq_number": key,
			"tree_id": albero.id,
			"name": "Vertex_" + key,
			"level": k,
			"attributes": vatt.slice(0),
			"edge": {
				"id_edge": "edge_" + key,
				"attributes": eatt.slice(0),

			}
	})
	//anchestors.push(node)
	for(var i = 0; i < split; i++){
		buildTreeRecursiveSimple(index, albero, split, depth, k+1, setAttributesValues(albero.vertecesAttributeList), setAttributesValues(albero.edgesAttributeList))
		if(i == split-1){
			//anchestors.pop();
			ancestors.shift()
	    }
	}
	
	
	
}


//BUILDTREE FUNCTION
var buildTreeIterative = function(key, albero, split, depth, ant, k){
	//Insert insert
	("chiamata ricorsiva: " + key)
	insertNode({
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
	}, albero.total)

	index++;
	//CASO FOGLIA
	if (k == depth){
		if(index == albero.total){
			console.timeEnd("perf")
			//bulk.execute(function(err, result) {
		    //   if(err){
		    //   	console.log(err)
		    //   }
		    //   console.timeEnd("perf2")
		    //   console.log("inseriti")
		    //   //db.close();
		    // });
		}
		return;
	}

	//CASO FIGLI
	delete node.anchestors;
	anchestors.unshift(node)
	//anchestors.push(node)
	for(var i = 0; i < split; i++){
		buildTreeRecursive(index, albero, split, depth, anchestors, k+1)
		if(i == split-1){
			//anchestors.pop();
			anchestors.shift()
	    }
	}
}

var simulateMillions = function(){
	for(var i = 0; i < 1000000; i++){
		console.log("chiamata: " + i)
		Nodo.collection.insert({
			"seq_number": i,
			"tree_id": i,
			"name": "Vertex_" + i,
			"level": i,
			"attributes": [],
			"edge": {
				"id_edge": "edge_" + i,
				"attributes": [],

			},
			"ancestors": []
		}, function(err, res){
			if(err){
				console.log(err)
				throw err;
			}
			console.log("inserito: " + i)
		})
	}
}

var simulateInsert = function(){
	var tt = Date.now();
	async.times(1000, function(n, next){
	console.log("chiamata: " + n)
	  Nodo.collection.insert({
			"seq_number": n,
			"tree_id": tt,
			"name": "Vertex_" + n,
			"level": n,
			"attributes": [],
			"edge": {
				"id_edge": "edge_" + n,
				"attributes": [],

			},
			"ancestors": []
		}, function(err, res){
			if(err){
				console.log(err)
				throw err;
			}
			console.log("inserito: " + n)
			next(err, res)
		})
	}, function(err, res) {
	  // it's done
	  //console.log(res)
	  console.timeEnd("perf2")
	});
};

ind = 0;
var simulateInsertR = function(n){
	console.log("chiamata: " + n)
	  Nodo.collection.insert({
			"seq_number": n,
			"tree_id": 34523455,
			"name": "Vertex_" + n,
			"level": n,
			"attributes": [],
			"edge": {
				"id_edge": "edge_" + n,
				"attributes": [],

			},
			"ancestors": []
		}, function(err, res){
			if(err){
				console.log(err)
				throw err;
			}
			console.log("inserito: " + n)
			ind++;
			if(n == 99999){
				console.timeEnd("perf2")
			}else{
				simulateInsertR(ind)
			}
		})
	};


/* GET users listing. 
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
*/


module.exports = router;