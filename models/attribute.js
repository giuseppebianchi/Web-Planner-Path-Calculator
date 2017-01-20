var mongoose    =   require("mongoose");
mongoose.connect('mongodb://localhost:27017/ppc');
// create instance of Schema
var Schema =   mongoose.Schema;

var attributeSchema = new Schema({
	"name": String,
	"type": String, //if is for node or edge
	"k": Number,
	"n": Number,
	"isInteger": Boolean
})

// create model if not exists.
var Tree = mongoose.model('Tree',treeSchema);

// make this available to our users in our Node applications
module.exports = Tree;