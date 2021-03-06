/*jslint devel: true, browser: true*/
/*global require, process*/
//
//  SceneNodeEditor
//
var http = require('http'),
    fs = require('fs'),
	socketio = require('socket.io'),
	exec = require('child_process').exec,
	spawn = require('child_process').spawn,
    path = require('path'),
	HRENDER = '../hrender',
	HRENDER_ARG = ['scene.scn', 'MODE=EDITOR'],
	port = 8080,
	wshttpserver = http.createServer(function (req, res) {
		'use strict';
		console.log('REQ>', req.url);
		res.end("websocket operator");
	}).listen(58432),
	websocket = require('websocket'),
	ws = new websocket.server({httpServer : wshttpserver,
							   maxReceivedFrameSize : 0x1000000, // more receive buffer!! default 65536B
							   autoAcceptConnections : false});

//-----------------------------------------------------

function makeNodeList(callback) {
	"use strict";
	var nodeDir = './nodes';
	fs.readdir(nodeDir, function (err, files) {
		var infofile,
			nodeDirPath,
			fileCounter,
			customFuncLua,
			nodelist = [],
			i;
		if (err) {
			return;
		}

		fileCounter = 0;
		function finishLoad() {
			fileCounter = fileCounter - 1;
			if (fileCounter === 0) {
				callback(null, nodelist);
			}
		}
		function loadFunc(nodeDirPath) {
			return function (err, data) {
				try {
					var json = JSON.parse(data);
					if (json.customfuncfile !== undefined) {
						customFuncLua = fs.readFileSync(nodeDirPath + "/" + json.customfuncfile, 'utf8');
						json.customfunc = customFuncLua;
					}
					nodelist.push(json);
				} catch (e) {
					console.log('[Error] Failed Load:' + nodeDirPath + "/info.json", e);
				}
				finishLoad();
			};
		}
		for (i in files) {
			if (files.hasOwnProperty(i)) {
				if (files[i].substr(0, 1) !== '.') {
					nodeDirPath = nodeDir + "/" + files[i];
					infofile = nodeDirPath + "/info.json";
					console.log(infofile);
					fileCounter = fileCounter + 1;
					fs.readFile(infofile, 'utf8', loadFunc(nodeDirPath));
				}
			}
		}
	});
}

//------------------------------------------------------
function writeFile(data, filepath, callback) {
	"use strict";
	fs.writeFile(filepath, data, function (err) {
		if (err) {
			console.log(err);
			return;
		}
		callback();
	});
}
function renderScene(scene, socket) {
	"use strict";
	console.log('TRY RENDER');
	writeFile(scene, "./scene.scn", function () {
		try {
			var process = spawn(HRENDER, HRENDER_ARG);
			process.stdout.on('data', function (data) {
				console.log('stdout: ' + data);
				socket.emit('stdout', data.toString());
			});
			process.stderr.on('data', function (data) {
				console.log('stderr: ' + data);
				socket.emit('stderr', data.toString());
			});
			process.on('exit', function (code) {
				console.log('exit code: ' + code);
			});
			process.on('error', function (err) {
				console.log('process error', err);
				socket.emit('stderr', "can't execute program:" + HRENDER + "\n");
			});
		} catch (e) {
			console.log('process error', e);
			socket.emit('stderr', "can't execute program:" + HRENDER + "\n");
		}
	});
}

//------------------------------------------------------

var server = http.createServer(function (req, res) {
    'use strict';
    console.log('REQ>', req.url);
    var file, fname, url, ext;
    if (req.url === '/') {
        file = fs.readFileSync('./root/index.html');
        res.end(file);
	} else if (req.url === '/nodelist.json') {
		makeNodeList((function (res) {
			return function (err, nodelist) {
				file = JSON.stringify(nodelist);
				res.end(file);
			};
		}(res)));
    } else {
        try {
            url = './root' + req.url;
            fs.readFile(url, function (err, data) {
    			ext = path.extname(url);
    			if (ext === ".css") {
    				res.writeHead(200, {'Content-Type': 'text/css', charaset: 'UTF-8'});
    			} else if (ext === ".html" || ext === ".htm") {
    				res.writeHead(200, {'Content-Type': 'text/html', charaset: 'UTF-8'});
    			} else if (ext === ".js" || ext === ".json") {
    				res.writeHead(200, {'Content-Type': 'text/javascript', charaset: 'UTF-8'});
    			} else {
    				res.writeHead(200);
    			}
                res.end(data);
            });
        } catch (e) {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end('not found\n');
        }
    }
});
if (process.argv.length === 3) {
    port = process.argv[2];
} else if (process.argv.length > 3) {
	var np = 1;
	for (i=2; i < process.argv.length; i = i + 2) {
		if (process.argv[i] == '-p') {
			port = process.argv[i+1];
		} else if (process.argv[i] == '-np') {
			console.log('MPI mode');
			np = process.argv[i+1];
	    	HRENDER_ARG = ['-np', np, HRENDER, 'scene.scn', 'MODE=EDITOR'],
 		   	HRENDER = 'mpirun';
		}
	}
}

server.listen(port);
console.log('start server "http://localhost:' + port + '/"');

//------------------------------------------------------------

var io = socketio(server);
io.on('connection', function (socket) {
	"use strict";
	console.log('connected');
	socket.on('sendScene', function (jsondata) {
		try {
			var data = JSON.parse(jsondata);
			renderScene(data.scene, socket);
		} catch (e) {
			console.log('[Error] Failed to render scene');
		}
	});
});

ws.on('request', function (request) {
	"use strict";
	console.log(request.origin);
	var connection = request.accept(null, request.origin);
	console.log('[CONNECTION] Websocket connection accepted : + (new Date())');
	connection.on('message', function (message) {
		var buffer;
		console.log("on websocket message");
		console.log(message);
		if (message.type === 'binary') {
			if (message.binaryData && message.binaryData.length > 0) {
				io.sockets.emit('resultimage', message.binaryData);
			}
		}
	});
});

ws.on('close', function () {
	"use strict";
	console.log('[CONNECTION CLOSED]');
});

//------------------------------------------------------------
