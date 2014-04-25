var cluster = require('cluster');

if (cluster.isMaster) {
  configuration = require('./config');
  configuration.configure();
  console.log("Starting Hapsus in " + configuration.config.mode + " mode on port " + configuration.config.port + " with pid " + process.pid +  " at " + (new Date()));

  var shuttingDown = false;

  for (var i = 0; i < require('os').cpus().length + 1; i++) {
    cluster.fork();
  }

  cluster.on('exit', function(worker, code, signal) {
    // If the worker shuts down themself, let it be as it is gracefully exiting
    if(worker.suicide) {
      console.log("Worker " + worker.process.pid+ " shut down successfully");
    } else { // If the worker dies, create a new one to take its place
      console.log('Worker ' + worker.process.pid + ' died, attempting to restart');
      cluster.fork();
    }
  });

  // Gracefully allow the workers to disconect when exiting
  process.on('SIGTERM', gracefulExit).on('SIGINT', gracefulExit);
  
  process.on('exit', function () {
    console.log("Hapsus successfully shut down");
  });
} else {
  require('./lib/worker');
}

function gracefulExit() {
  console.log("Caught SIGTERM or SIGINT, shutting down");
  for (var id in cluster.workers) {
    cluster.workers[id].send('DISCONNECT');
  }
}