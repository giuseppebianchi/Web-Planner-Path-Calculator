var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose')
var app = express();
var router = express.Router();
var Tree = require("../models/tree");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({"extended" : false}));
var db = mongoose.connection;

router.get("/trees",function(req,res){
    Tree.getTrees(function(err, trees){
    	if(err){
    		throw err;
    	}
    	res.json(trees)
    })
});

router.get("/trees/:id",function(req,res){
    Tree.getTreeById(req.params.id, function(err, tree){
    	if(err){
    		throw err;
    	}
    	res.json(tree)
    })
});

/* GET users listing. 
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
*/


module.exports = router;