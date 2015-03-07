/*jslint devel:true*/
/*global require, Error*/

var http = require('http'),
	seserver = http.createServer(function (req, res) {
		'use strict';
		console.log('REQ>', req.url);
		res.end("websocket sender");
	}).listen(8080),
	websocket = require('websocket'),
	ws = new websocket.server({httpServer : seserver,
							   maxReceivedFrameSize : 0x1000000, // more receive buffer!! default 65536B
							   autoAcceptConnections : false}),
	ws_connections = {},
	id_counter = 0,
	renderNode = null, // one renderer
	clientNode = null; // one client

ws.on('request', function (request) {
	"use strict";
	var connection = request.accept(null, request.origin),
		retlua;

	console.log('[CONNECTION] Connection accepted : id = ' + id_counter + ' / ' + (new Date()));
	// save connection with id
	connection.id = id_counter;
	ws_connections.id_counter = connection;
	id_counter = id_counter + 1;
	
	
	function masterMethod(method, param) {
		if (method === 'register') { // Register Renderer or Client
			if (param.mode === 'renderer') {
				console.log('[CONNECTION] Connected Renderer id = ' + connection.id);
				connection.type = 'renderer';
				renderNode = connection;
			} else if (param.mode === 'client') {
				console.log('[CONNECTION] Connected client id = ' + connection.id);
				connection.type = 'client';
				clientNode = connection;
			}
		}
	}
	
	connection.on('message', function (message) {
		var ret, result, param;
		//console.log('[DEBUG] message=', message);
		if (message.type === 'utf8') {
			//console.log('[DEBUG] RET=' + message.utf8Data);
			try {
				ret = JSON.parse(message.utf8Data);
				if (ret.error) {
					if (ret.to === 'master') {
						console.error('[Error]:', ret.err);
					} else if (clientNode && ret.to === 'client') { // for client
						clientNode.send(message.utf8Data);
					} else if (renderNode && ret.to === 'renderer') { // for renderer
						clientNode.send(message.utf8Data);
					}
				} else if (ret.result) {
					// syntax sugar
					if (typeof ret.result === 'object') {
						result = ret.result;
					} else {
						result = JSON.parse(ret.result);
					}
					
					if (ret.to === 'master') {
						console.error('[Result]:', result);
					} else if (clientNode && ret.to === 'client') { // for client
						clientNode.send(JSON.stringify(ret));
					} else if (renderNode && ret.to === 'renderer') { // for renderer
						clientNode.send(JSON.stringify(ret));
					}
				} else if (ret.method) {
					
					// syntax sugar
					if (typeof ret.param === 'object') {
						param = ret.param;
					} else {
						param = JSON.parse(ret.result);
					}
					
					if (ret.to === 'master') {
						masterMethod(ret.method, param);
					} else if (clientNode && ret.to === 'client') { // for client
						clientNode.send(JSON.stringify(ret));
					} else if (renderNode && ret.to === 'renderer') { // for renderer
						renderNode.send(JSON.stringify(ret));
					}
				}
			} catch (e) {
				console.error('[ERROR] Invalid JSON data:-->\n' + message.utf8Data + '\n', e);
			}
		}
	});
	
	connection.on('close', function () {
		delete ws_connections[connection.id];
		console.log('[CONNECTION] Connection closed : type = [' + connection.type + "] id = " + connection.id);
	});
});