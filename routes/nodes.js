var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose')
var debug = require('express');
var app = express();
var router = express.Router();

var Nodo = require("../models/node");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({"extended" : false}));

router.get("/",function(req,res){
    res.json("nodes")
});

router.get("/search/sequence",function(req,res){
    Nodo.getNodeByNumber(req.query, function(err, node){
        if(err){
            throw err;
        }
        console.log(node)
        res.json(node[0])
        debug(node)
    })
});

router.get("/search/name",function(req,res){
    Nodo.getNodeByName(req.query, function(err, node){
        if(err){
            throw err;
        }
        res.json(node[0])
        debug(node)
    })
});

router.get("/:id",function(req,res){
    Nodo.getNodeById(req.params.id, function(err, tree){
    	if(err){
            throw err;
        }
        res.json(node[0])
        debug(node)
    })
});

/* GET users listing. 
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
*/


module.exports = router;