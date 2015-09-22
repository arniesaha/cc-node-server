/* Author: YOUR NAME HERE
*/

$(document).ready(function() {   

  		var socket = io.connect();


		socket.on('new message', function (data) {
    	// we tell the client to execute 'new message'
		pkgName = data;
    
		//json object with app data to pass to the client
		var appJSON;
		gplay.app(pkgName)
			.then(function(app){
				
				appJSON = '{ "title":" '+app.title+ '" , "category":" '+app.genre+ '" , "score":" '+app.price+ '" , "free":" '+app.free+ '" , "description":" '+app.description+ '"}';
				$('#receiver').append('<li>' + appJSON + '</li>');  
				console.log(appJSON);
        		//emitting json data back to client
        		socket.broadcast.emit('new message', {
          			//username: socket.username,
           			message: appJSON  
        		});
        
			})
		.catch(function(e){
				console.log('There was an error fetching the application!');
		});

  		});

});