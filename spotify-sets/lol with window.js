//Set up spotify auth stuff

//make request URL
var spotifyAPI = "https://accounts.spotify.com/authorize";
var APIParams = {
	client_id: '0ea4dab611da40cea8d888db992c25d2',
	response_type: 'token',
	redirect_uri: 'http://127.0.0.1/sets/',
	scope: 'playlist-read-private playlist-modify-public playlist-modify-private'
}

//disable result button
$('#gen').addClass('disabled');

spotifyAPI += "?" + $.param(APIParams);

//Check for token
var frag =  jQuery.deparam.fragment()
if ( frag['access_token'] )
{
	gotAuth(frag);
}
else
{
	window.location.replace( spotifyAPI );
}

//get the user's ID and call gotId
function gotAuth( auth )
{
	$.ajax({
	   url: 'https://api.spotify.com/v1/me',
	   headers: {
	       'Authorization': 'Bearer ' + auth['access_token']
	   },
	   success: function(response) {
	       var userId = response['id'];
	       gotId( userId, auth);
	   }
	});
}

//For once the user ID has been saved
function gotId( userId, auth ) {
	var app = {
			userId: userId,
			auth: auth,
			selection1: null,
			selection2: null
	};
	window.playlists = {};
	var firstURL = 'https://api.spotify.com/v1/users/' + userId + '/playlists';
	getPlayList( app, firstURL );
}

//saves the list of user's playlists to window.playlists . Such good practice! :P
function getPlayList( app, nextURL ) {
	$.ajax({
	   url: nextURL,
	   headers: {
	       'Authorization': 'Bearer ' + app.auth['access_token']
	   },
	   success: function(response) {
	       response.items.forEach( function( item ) {
	       		window.playlists[ item['id'] ] = item['name'] ;
	       });
	       alert( app.userId );
	       if ( response.next )
	       {
	       		getPlayList( app, response.next ) 
	       }
	       else
	       {
	       		gotPlaylists( app );
	       }
	   }
	});
}

function gotPlaylists( app )
{

	printPList( app, null );

	$("#pFilter").on( 'input', function() {
		printPList( app,  $("#pFilter").val() );
	});

	
}

//update when a playslist is swapped
function playlistChanged( app )
{
	if ( app.selection1 != null )
	{
		$("#text1").empty().append( window.playlists[ app.selection1 ] );
	}
	if ( app.selection2 != null )
	{
		$("#text2").empty().append( window.playlists[ app.selection2 ] );
	}
	updateSelects( app );
	if ( app.selection1 != null && app.selection2 != null )
	{
		$('#gen').removeClass('disabled');
		$('#gen').click({app: app}, genResult);
	}
	else
	{
		$('#gen').addClass('disabled');
	}

}

//Generate the result
function genResult( event )
{
	var app = event.data.app;
	
	//First Playlist Tracks

}

//Print the playlists
function printPList( app, filter )
{
	$('#playlistsTable').empty();
	for ( pl in window.playlists )
	{
		if ( filter != null )
		{
			test = window.playlists[pl].toLowerCase();
			filter = filter.toLowerCase();
			if ( ~test.indexOf( filter ) )
			{
				$('#playlistsTable').append(
					$('<tr>').append( '<td>' + window.playlists[pl] + '</td>' )
						.append('<td><input class="btn btn-default but1" type="button" value="1" id="' + pl + '"></td>')
						.append('<td><input class="btn btn-default but2" type="button" value="2" id="' + pl + '"></td>')
				);
			}
		}
		else
		{
			$('#playlistsTable').append(
					$('<tr>').append( '<td>' + window.playlists[pl] + '</td>' )
						.append('<td><input class="btn btn-default but1" type="button" value="1" id="' + pl + '"></td>')
						.append('<td><input class="btn btn-default but2" type="button" value="2" id="' + pl + '"></td>')
				);
		}
		
	}
	updateSelects( app );
	$(".but1").click({app: app}, clickBut1);
	function clickBut1( event )
	{
		if ( event.data.app.selection1 != $(this).attr( 'id' ) )
		{
			event.data.app.selection1 = $(this).attr( 'id' );
			playlistChanged( event.data.app );
		}	 
	}

	$(".but2").click({app: app}, clickBut2);
	function clickBut2( event )
	{
		if ( event.data.app.selection2 != $(this).attr( 'id' ) )
		{
			event.data.app.selection2 = $(this).attr( 'id' );
			playlistChanged( event.data.app );
		}	 
	}
}

function updateSelects( app )
{
	if ( app.selection1 != null )
	{
		$(".but1").css('background-color','');
		$("#" + app.selection1 ).css('background-color','orange');
	}
	if ( app.selection2 != null )
	{
		$(".but2").css('background-color','');
		$("#" + app.selection2 + ".but2").css('background-color','orange');
	}
}

function setStuff() {
		JS.require('JS.Set', function(Set) { 
		var set1 = new Set([2,4,6,8]);
		var set2 = new Set([2,4]);
		var result = set1.intersection( set2 );

		result.forEach(function(element) {
			//console.log( element );
		});
	});
}