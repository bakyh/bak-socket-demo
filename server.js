// Based off of Shawn Van Every's Live Web
// http://itp.nyu.edu/~sve204/liveweb_fall2013/week3.html


// HTTP Portion
var http = require('http');
// URL module
var url = require('url');
var path = require('path');

// Using the filesystem module
var fs = require('fs');

var server = http.createServer(handleRequest);
server.listen(8080);

console.log('Server started on port 8080');

function handleRequest(req, res) {
  // What did we request?
  var pathname = req.url;

  // If blank let's ask for index.html
  if (pathname == '/') {
    pathname = '/index.html';
  }

  // Ok what's our file extension
  var ext = path.extname(pathname);

  // Map extension to file type
  var typeExt = {
    '.html': 'text/html',
    '.js':   'text/javascript',
    '.css':  'text/css'
  };

  // What is it?  Default to plain text
  var contentType = typeExt[ext] || 'text/plain';

  // User file system module
  fs.readFile(__dirname + pathname,
    // Callback function for reading
    function (err, data) {
      // if there is an error
      if (err) {
        res.writeHead(500);
        return res.end('Error loading ' + pathname);
      }
      // Otherwise, send the data, the contents of the file
      res.writeHead(200,{ 'Content-Type': contentType });
      res.end(data);
    }
  );
}


// WebSocket Portion
// WebSockets work with the HTTP server
var io = require('socket.io').listen(server);

var counter = 0

// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection',
  // We are given a websocket object in our function
  function (socket) {

  	// Get the client's IP Address and send it back.
    var ip = socket.handshake.address.split(":")[3];
    console.log("Connected: " + ip + " " + socket.id);
    socket.emit("ip", ip);

    // When this user emits, client side: socket.emit('otherevent',some data);
    socket.on('distribute',
      function(data) {
      	var target = data.target;
        // Data comes in as whatever was sent, including objects
		counter = counter + 1;
        console.log("[" + counter + "] Data from: " + data.senderID + " to: " + target);
        switch (target) {
        	case 'all':		// all including sender
        		io.sockets.emit('distribute', data);
        		break;

        	case 'all-except-me':	// all but not including sender
        		socket.broadcast.emit('distribute', data);
        		break;

        	case 'any-except-me':	// anyone but not including me
        		// to do
        		break;

        	case 'any':	// anyone including sender
        	default:
        		var length = io.sockets.sockets.length;
        		var index = Math.floor(Math.random() * length);
        		io.sockets.sockets[index].emit('distribute', data);
        		break;
        }
      }
    );

    socket.on('disconnect', function() {
      console.log("Disconnected: " + socket.id);
    });
  }
);
