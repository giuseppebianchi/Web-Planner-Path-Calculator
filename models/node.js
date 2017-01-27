var mongoose    =   require("mongoose");
mongoose.connect('mongodb://localhost:27017/ppc');
// create instance of Schema
var Schema =   mongoose.Schema;

//create Node schema
var nodeSchema = new Schema({
	tree_id: Schema.Types.ObjectId,
	seq_number: Number,
	name: String,
	level: Number,
	attributes: Array,
	edge: {
		"idEdge": Number,
		"attributes": Array
	},
	ancestors: Array
})


// create model if not exists.
var Node = mongoose.model('NodeModel', nodeSchema);

// make this available to our users in our Node applications
module.exports = Node;

// CREATE TREE
module.exports.createNode = function(nodo, callback){
	Node.create(nodo, callback)
}

// GET NODE BY SEQ NUMBER
module.exports.getNodeByNumber = function(num, id_tree, callback){
	Tree.find({
		seq_number: num,
		tree_id: id_tree
	})
}

// GET NODE BY NAME
module.exports.getNodeByName = function(name, id_tree, callback){
	Tree.find({
		name: name,
		tree_id: id
	})
}