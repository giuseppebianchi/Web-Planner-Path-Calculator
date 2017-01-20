var mongoose    =   require("mongoose");
mongoose.connect('mongodb://localhost:27017/ppc');
// create instance of Schema
var Schema =   mongoose.Schema;


/*
//create Attribute schema
var attributeSchema = new Schema({
	"name": String,
	"type": String, //if is for node or edge
	"k": Number,
	"n": Number,
	"isInteger": Boolean
})

//create Edge schema
var edgeSchema = new Schema({
	"idEdge": Number,
	"edgeAttributeList": [{ 
			"value": Number,
			"type":	attributeSchema
	}]
})

//create Node schema
var Node = new Schema({
	"idNode": Number,
	"name": String,
	"nodeAttributeList": [{ 
			"value": Number,
			"type":	Attribute
	}],
	"edge": edgeSchema,
	"ancestors": [Schema.Types.ObjectId]
})

// create Tree schema
var treeSchema  = new Schema({
	"idTree": Number,
    "name": String,
    "splitSize": Number,
    "depthSize": Number,
    "total": Number,
    "vertecesAttributeList": [Attribute],
    "edgesAttributeList": [Attribute],
    "creation": Date,
    "lastOperation": Date,
    "nodes": [Node]
});
*/


var treeSchema  = new Schema({
	"idTree": Number,
    "name": String,
    "splitSize": Number,
    "depthSize": Number,
    "total": Number,
    "vertecesAttributeList": [{
		"name": String,
		"ref": String, //if is for node or edge
		"k": Number,
		"n": Number,
		"isInteger": Boolean
	}],
    "edgesAttributeList": [{
		"name": String,
		"ref": String, //if is for node or edge
		"k": Number,
		"n": Number,
		"isInteger": Boolean
	}],
    "creation": {
    	"type": Date,
    	"default": Date.now
    },
    "lastOperation": Date,
    "nodes": [{
		"idNode": Number,
		"name": String,
		"nodeAttributeList": [{
				"name": String,
				"value": Number,
		}],
		"edge": {
			"idEdge": Number,
			"edgeAttributeList": [{ 
				"name": String,
				"value": Number,
			}]
		},
		"ancestors": [Schema.Types.ObjectId]
	}]
});



// create model if not exists.
var Tree = mongoose.model('Tree',treeSchema);

// make this available to our users in our Node applications
module.exports = Tree;