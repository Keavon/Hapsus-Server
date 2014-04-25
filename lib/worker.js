cluster = require('cluster');

configuration = require('../config');
configuration.configure();

console.log("Worker " + cluster.worker.process.pid + " coming online");

var server = require('http').Server(function(req, res) {
  //This handles the url checking for the server, if it matches the route or the route without a ending slash, display the server info. Example Path= "/game/" this will display server info on "/game" and "/game/"
  if (require('url').parse(req.url).pathname == configuration.config.path.replace(/\/+$/, '') || require('url').parse(req.url).pathname == configuration.config.path.replace(/\/+$/, '') + "/") {
    res.writeHead(200, 'application/json');
    res.end(JSON.stringify({server: "hapsus", name: configuration.config.name, version: require('../package.json').version}));
  } else {
    res.writeHead(404, 'text/plain');
    res.end("404 not found. :'(");
  }
});

server.listen(configuration.config.port);

//This code adds a graceful shutdown to the worker, so hopefullly it won't die in the middle of a connection.
process.on('SIGTERM', gracefulExit).on('SIGINT', gracefulExit).on('message', function (message) {
    if(message == "DISCONNECT") {
      gracefulExit();
    } else {
      console.log("Got message " + message);
    }
});


var alreadyShutdown = false; 
function gracefulExit() {
  if(!alreadyShutdown) {
    alreadyShutdown = true;
    console.log("Worker " + cluster.worker.process.pid + " exiting gracefully");
    cluster.worker.disconnect();
  } else {
    console.log("Already disconecting");
  }
}