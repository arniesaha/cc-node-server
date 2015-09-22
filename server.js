//setup Dependencies
var connect = require('connect')
    , express = require('express')
    , io = require('socket.io')
    , port = (process.env.PORT || 3000)
	, gplay = require('google-play-scraper');
	
//Setup Express
var server = express.createServer();
server.configure(function(){
    server.set('views', __dirname + '/views');
    server.set('view options', { layout: false });
    server.use(connect.bodyParser());
    server.use(express.cookieParser());
    server.use(express.session({ secret: "shhhhhhhhh!"}));
    server.use(connect.static(__dirname + '/static'));
    server.use(server.router);
});

//setup the errors
server.error(function(err, req, res, next){
    if (err instanceof NotFound) {
        res.render('404.jade', { locals: { 
                  title : '404 - Not Found'
                 ,description: ''
                 ,author: ''
                 ,analyticssiteid: 'XXXXXXX' 
                },status: 404 });
    } else {
        res.render('500.jade', { locals: { 
                  title : 'The Server Encountered an Error'
                 ,description: ''
                 ,author: ''
                 ,analyticssiteid: 'XXXXXXX'
                 ,error: err 
                },status: 500 });
    }
});
server.listen( port);

//Array to Store Package Names from the Client
var pkgName = {};

//Setup Socket.IO
var io = io.listen(server);
io.sockets.on('connection', function(socket){
	
	console.log('Client Connected');
	//Listen to packageNames from Android Client
	// when the client emits 'new message', this listens and executes
	socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
	pkgName = data;
    
		//json object with app data to pass to the client
		var appJSON;
		gplay.app(pkgName)
			.then(function(app){
				 //'{ "appId":"'+app.appId+'", title":" '+app.title+ '" , url":"'+app.url+'", "minInstalls":"'+app.minInstalls+'", "maxInstalls":"'+app.maxInstalls+'", "score":"'+app.score'", "reviews":"'+app.reviews+'", "category":" '+app.genre+ '" , "price":" '+app.price+ '" , "free":" '+app.free+ '" , "developer":"'+app.developer+'", "description":" '+app.description+ '"}';
      
				appJSON = '{ "appId":" '+app.appId+ '" ,"title":" '+app.title+ '" , "url":" '+app.url+ '" , "minInstalls":" '+app.minInstalls+ '" , "maxInstalls":" '+app.maxInstalls+ '" , "score":" '+app.score+ '" , "reviews":" '+app.reviews+ '" ,"category":" '+app.genre+ '" , "price":" '+app.price+ '" , "free":" '+app.free+ '" , "developer":" '+app.developer+ '" ,"description":" '+app.description+ '"}';
				console.log(appJSON);
        io.sockets.emit('new message', {
          message: appJSON  
        });
			})
		.catch(function(e){
				console.log('There was an error fetching the application!');
		});
  });
  socket.on('disconnect', function(){
    console.log('Client Disconnected.');
  });
});




///////////////////////////////////////////
//              Routes                   //
///////////////////////////////////////////

/////// ADD ALL YOUR ROUTES HERE  /////////

server.get('/', function(req,res){
  res.render('index.jade', {
    locals : { 
              title : 'Your Page Title'
             ,description: 'Your Page Description'
             ,author: 'Your Name'
             ,analyticssiteid: 'XXXXXXX' 
            }
  });
});


//A Route for Creating a 500 Error (Useful to keep around)
server.get('/500', function(req, res){
    throw new Error('This is a 500 Error');
});

//The 404 Route (ALWAYS Keep this as the last route)
server.get('/*', function(req, res){
    throw new NotFound;
});

//Get URL parameter
server.get('/p', function(req, res) {
	res.send("package name is set to " + req.query.pkgName);
});

function NotFound(msg){
    this.name = 'NotFound';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}

		

 if(pkgName.length > 0){
	 console.log(pkgName.length);
 }
  
  console.log('Listening on http://0.0.0.0:' + port );
