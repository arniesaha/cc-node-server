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

var Queue = require('firebase-queue');
Firebase = require('firebase');
var apiKey = 'AIzaSyCcK68Hss_1MuFaYrMar6zJDmiP4om86C8';
var J
var gcm = require('node-gcm');
var queueRef = new Firebase("https://popping-fire-3223.firebaseio.com/queue");
var queue = new Queue(queueRef, function (data, progress, resolve, reject) {
    processData(data);
    console.log(data);
    setTimeout(function () {
        resolve();
    }, 1000)

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

function updateFollowCount(data, action) {
    var message = new gcm.Message();
    var registrationIds = [];
    switch (action) {
        case 'add_count' :
            message.addData('task', 'add_followers_count');
            break;

        case 'decrease_count' :
            message.addData('task', 'decrease_followers_count');
            break;
    }
    message.addData('sender_id', data.sender_id);
    registrationIds.push(data.reciever_id);
    var sender = new gcm.Sender(apiKey);
    sender.send(message, registrationIds, 4, function (err, result) {
        console.log(result);
    });

}


function updateFollowers(data) {
    var message = new gcm.Message();
    var registrationIds = [];
    console.log(data.reciever_ids);
    var ids = JSON.parse(data.reciever_ids);
    for( i = 0 ; i <ids.length ;  i++ ){
        registrationIds.push(ids[i]);
        console.log(ids[i]);
    }
    message.addData('task','followed_update');
    message.addData('sender_id',data.sender_id);
    message.addData('changed_field',data.changed_field);
    message.addData('changed_value',data.changed_value);
    var sender = new gcm.Sender(apiKey);
    sender.send(message, registrationIds, 4, function (err, result) {
        console.log(result);
    });

}


function processData(data) {
    switch (data.type_task) {
        case 'add_followers_count' :
            updateFollowCount(data, "add_count");
            break;
        case 'decrease_followers_count' :
            updateFollowCount(data, "decrease_count");
            break;

        case 'update_followers' :
            console.log("We should update the followers");
            updateFollowers(data);
            break;
    }

}

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
