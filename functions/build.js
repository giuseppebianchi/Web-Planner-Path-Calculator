process.on('message', function(t) {

	console.log("start child...", t)

	var mongoose = require('mongoose')

	var Tree = require("../models/tree");
	var Nodo = require("../models/node");


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

	var ancestors = [],
	index = 0,
	inserted = 0,
	nodes = [],
	performance = Date.now();
	console.time("perf")
	console.time("perf2")
	console.log(process.memoryUsage())


	  // Do work  (in this case just up-case the string
	  
	  buildTreeRecursiveSmart(0, t, t.splitSize, t.depthSize, 0, setAttributesValues(t.vertecesAttributeList), setAttributesValues(t.edgesAttributeList))
	  // Pass results back to parent process
	  //process.send("ok");




	function callbackProcess(){
		console.log(process.memoryUsage())
		process.send("ok");
	}

	//BUILDTREE FUNCTION SMART
	function buildTreeRecursiveSmart(key, albero, split, depth, k, vatt, eatt){
		//console.log("chiamata ricorsiva: "+ key)
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
		

		index++;
		//CASO FOGLIA
		if (k == depth){
			if(index == albero.total){
				console.timeEnd("perf")
				console.log("inserting nodes into database...")
				smartInsert(albero);

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
			buildTreeRecursiveSmart(index, albero, split, depth, k+1, setAttributesValues(albero.vertecesAttributeList), setAttributesValues(albero.edgesAttributeList))
			if(i == split-1){
				//ancestors.pop();
				ancestors.shift()
		    }
		}

	}


	function smartInsert(t){
		//Connect to Mongoose
		mongoose.connect('mongodb://localhost:27017/ppc', {
			raw: true,
		  	server: {
		    	socketOptions: {
		      		socketTimeoutMS: 0,
		      		connectTimeoutMS: 0
		    }
		  }
		});
		
		//j is the number of inserts to check last operation
		var j = Math.ceil(t.total/990);
		console.log("smart insert", j)
		var nods;
		while(nodes.length > 0){
			nods =  nodes.slice(-990)
				Nodo.collection.insert(nods, function(err, data){
					//console.log(data)
					if(err){
						throw err;
					}
					inserted++
					if(inserted == j){
						console.timeEnd("perf2")
						console.log(process.memoryUsage())
						var perf = Date.now() - performance;
					
						Tree.updateTree({id: t.id, perf: perf + " ms"}, function(err, data){
							//console.log(data)
							console.log("creation time has been updated")
							// Pass results back to parent process
							callbackProcess()
						});
					}
					
					
				})

				try{
					nodes.length = nodes.length - 990;
					
				}catch(err){
					nodes.length = 0
					
				}
		}
	}

}); //end worker