var express = require('express');
var mongoose = require('mongoose');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const v8 = require('v8');
//v8.setFlagsFromString('--max_old_space_size=4096');

//Connect to Mongoose
mongoose.connect('mongodb://localhost:27017/ppc?socketTimeoutMS=60000000&connectTimeoutMS=60000000&poolSize=3&journal=false', {
  journal: false,
  server: {
    socketOptions: {
      connectionTimeoutMS: 600000000,
      socketTimeoutMS: 600000000
    }
  }
});

//ROUTES
var routes = require('./routes/index');
var test = require('./routes/test');
//var create = require('./routes/create');
var create = require('./routes/create_threads');
var trees = require('./routes/trees');
var nodes = require('./routes/nodes');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/create', create);
app.use('/trees', trees);
app.use('/nodes', nodes);
app.use('/test', test);
//app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
