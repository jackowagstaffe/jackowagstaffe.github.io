//Set up spotify auth stuff

//make request URL
var spotifyAPI = "https://accounts.spotify.com/authorize";
var APIParams = {
	client_id: '0ea4dab611da40cea8d888db992c25d2',
	response_type: 'token',
	redirect_uri: 'http://127.0.0.1/spotify-sets',
	scope: 'playlist-read-private playlist-modify-public playlist-modify-private'
}

//disable result button
$('#gen').addClass('disabled');

$(document).ready(function()
{
    $(".nano").nanoScroller();
});

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
	setTimeout(authExpired, auth.expires_in * 1000);
	$("#pFilter").val("");
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

function authExpired() 
{
	$('#auth-expired').modal('show');
}

//For once the user ID has been saved
function gotId( userId, auth ) 
{
	var app = {
			userId: userId,
			auth: auth,
			selection1: null,
			selection2: null
	};
	app.playlists = {};
	app.playlistUsers = {};
	var firstURL = 'https://api.spotify.com/v1/users/' + userId + '/playlists';
	getPlayList( app, firstURL );
}

//saves the list of user's playlists to app.playlists . 
function getPlayList( app, nextURL ) 
{
	$.ajax({
	   url: nextURL,
	   headers: {
	       'Authorization': 'Bearer ' + app.auth['access_token']
	   },
	   success: function(response) {
	       response.items.forEach( function( item ) {
	       		app.playlists[ item['id'] ] = item['name'] ;
	       		app.playlistUsers[ item['id'] ] = item['owner']['id'];
	       });
	       
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
		$("#text1").empty().append( app.playlists[ app.selection1 ] );
	}
	if ( app.selection2 != null )
	{
		$("#text2").empty().append( app.playlists[ app.selection2 ] );
	}
	updateSelects( app );
	if ( app.selection1 != null && app.selection2 != null )
	{
		$('#gen').removeClass('disabled');
		$('#gen').off().click({app: app}, genResult);
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
	
	app.playlistTrackNames1 = {};
	app.playlistTrackNames2 = {};
	app.playlistTracks1 = new Array();
	app.playlistTracks2 = new Array();
	app.resultTracks = new Array();
	app.gottracks = false;

	//First Playlist Tracks
	var firstURL = 'https://api.spotify.com/v1/users/' + app.playlistUsers[ app.selection1 ] + '/playlists/' + app.selection1 + '/tracks';
	getTracks( app, firstURL, 1 );
	var firstURL = 'https://api.spotify.com/v1/users/' + app.playlistUsers[ app.selection2 ] + '/playlists/' + app.selection2 + '/tracks';
	getTracks( app, firstURL, 2 );	
}

function setResults( app )
{
	//Do the calculations. 
	setOperation = $("#setOperation").val();
	switch (setOperation)
	{
		case "which are not in" :
			setDifference( app );
			break; 
		case "which are also in" :
			setIntersection( app );
			break;
		case "and add the tracks in" :
			setUnion( app )
			break;
	}
	//consl( app.resultTracks );
	printTracks( app );

	//set up playlst creator
	$("#playlistCreate").off().click({app: app}, playlistCreate);
	$('#playlistCreate').removeClass('disabled');
}

function setDifference( app )
{
	for ( var i = 0; i < app.playlistTracks1.length; i++ )
	{
		var found = false;
		for ( var j = 0; j < app.playlistTracks2.length; j++ )
		{
			if ( app.playlistTracks1[i] == app.playlistTracks2[j] )
			{
				found = true;
			}
		}
		if ( !found )
		{
			app.resultTracks.push( app.playlistTracks1[i] );
		}
	}
}

function setIntersection( app )
{
	for ( var i = 0; i < app.playlistTracks1.length; i++ )
	{
		var found = false;
		for ( var j = 0; j < app.playlistTracks2.length; j++ )
		{
			if ( app.playlistTracks1[i] == app.playlistTracks2[j] )
			{
				found = true;
			}
		}
		if ( found )
		{
			app.resultTracks.push( app.playlistTracks1[i] );
		}
	}
}

function setUnion( app )
{
	//add playlist 2 to results
	for ( var j = 0; j < app.playlistTracks2.length; j++ )
	{
		app.resultTracks.push( app.playlistTracks2[j] );
	}

	//add tracks from 1 that aren't in 2
	for ( var i = 0; i < app.playlistTracks1.length; i++ )
	{
		var found = false;
		for ( var j = 0; j < app.playlistTracks2.length; j++ )
		{
			if ( app.playlistTracks1[i] == app.playlistTracks2[j] )
			{
				found = true;
			}
		}
		if ( !found )
		{
			app.resultTracks.push( app.playlistTracks1[i] );
		}
	}
}

function playlistCreate( event )
{
	var app = event.data.app;

	var pName = $("#playlistName").val();
	console.log( pName );

	$.ajax({
	   url: 'https://api.spotify.com/v1/users/' + app.userId +'/playlists',
	   headers: {
	       'Authorization': 'Bearer ' + app.auth['access_token']
	   },
	   data:  JSON.stringify({ "name": pName }),
	   dataType: 'json',
	   contentType: "application/json",
	   method: "POST",
	   error: function( jqXHR, textStatus, errorThrown) {
	   		console.log( jqXHR );
	   },
	   success: function(response) {
	   		playlistAddTracks( app, response.id, 0 );
	   }
	});
}

function playlistAddTracks( app, pId, offset )
{
    var track_set = new Array();
    for (var i=0; i < app.resultTracks.length; i++)
    {
        track_set.push( "spotify:track:" + app.resultTracks[i] );

        if ( (i != 0 && i%98 == 0) || i == app.resultTracks.length - 1 )
        {
            sendTrackSet( app, track_set, pId );
            track_set = new Array();
        }
    }
    $('#playlist-created').modal('show');
}

function sendTrackSet( app, track_set, pId )
{
    console.log('sending tracks: ' + track_set.join() );
    $.ajax({
        url: 'https://api.spotify.com/v1/users/' + app.userId + '/playlists/' + pId  + '/tracks?uris=' + track_set.join(),
        headers: {
            'Authorization': 'Bearer ' + app.auth['access_token']
        },
        method: 'POST',
        success: function(response) {
            console.log('added set to playlist');
        },
        error: function( jqXHR, textStatus, errorThrown) {
            console.log( jqXHR );
        }
    });
}

function getTracks( app, nextURL, pNo ) 
{
	$.ajax({
	   url: nextURL,
	   headers: {
	       'Authorization': 'Bearer ' + app.auth['access_token']
	   },
	   success: function(response) {
	       response.items.forEach( function( item ) {
	       		if ( pNo == 1 )
	       		{
	       			app.playlistTrackNames1[ item.track['id'] ] = "" + item.track['name'] + " - " + item.track['artists'][0]['name'];
	       			app.playlistTracks1.push( item.track['id'] );
	       		}
	       		else
	       		{
	       			app.playlistTrackNames2[ item.track['id'] ] = "" + item.track['name'] + " - " + item.track['artists'][0]['name'];
	       			app.playlistTracks2.push( item.track['id'] );
	       		}
	       		
	       });
	       
	       if ( response.next )
	       {
	       		getTracks( app, response.next, pNo ) 
	       }
	       else
	       {
	       		gotTracks( app );
	       }
	   }
	});
}

function gotTracks( app)
{
	if ( app.gottracks )
	{
		setResults( app );
	}
	else
	{
		app.gottracks = true;
	}

}

//Print the playlist's tracks
function printTracks( app )
{
	$('#resultTracksTable').empty();
	tracks = app.resultTracks;
	tableId = "#resultTracksTable";

    if ( !tracks || tracks.length == 0)
    {
        $(tableId).append(
            $('<tr>').append( '<td>There are no results.</td>' )
        );
    }

	for ( tr in tracks )
	{
		var trackname = "";
		if ( typeof app.playlistTrackNames1[ tracks[tr] ] == "string" )
		{
			trackname = app.playlistTrackNames1[ tracks[tr] ];
		}
		else if ( typeof app.playlistTrackNames2[ tracks[tr] ] == "string" )
		{
			trackname = app.playlistTrackNames2[ tracks[tr] ];
		}
		$(tableId).append(
				$('<tr>').append( '<td>' + trackname + '</td>' )
			);
	}
}

//Print the playlists
function printPList( app, filter )
{
	$('#playlistsTable').empty();
	for ( pl in app.playlists )
	{
		if ( filter != null )
		{
			test = app.playlists[pl].toLowerCase();
			filter = filter.toLowerCase();
			if ( ~test.indexOf( filter ) )
			{
				$('#playlistsTable').append(
					$('<tr>').append( '<td>' + app.playlists[pl] + '</td>' )
						.append('<td><input class="btn btn-default but1" type="button" value="1" id="' + pl + '"></td>')
						.append('<td><input class="btn btn-default but2" type="button" value="2" id="' + pl + '"></td>')
				);
			}
		}
		else
		{
			$('#playlistsTable').append(
					$('<tr>').append( '<td>' + app.playlists[pl] + '</td>' )
						.append('<td><input class="btn btn-default but1" type="button" value="1" id="' + pl + '"></td>')
						.append('<td><input class="btn btn-default but2" type="button" value="2" id="' + pl + '"></td>')
				);
		}
		
	}
	updateSelects( app );
	$(".but1").off().click({app: app}, clickBut1);
	function clickBut1( event )
	{
		if ( event.data.app.selection1 != $(this).attr( 'id' ) )
		{
			event.data.app.selection1 = $(this).attr( 'id' );
			playlistChanged( event.data.app );
		}	 
	}

	$(".but2").off().click({app: app}, clickBut2);
	function clickBut2( event )
	{
		if ( event.data.app.selection2 != $(this).attr( 'id' ) )
		{
			event.data.app.selection2 = $(this).attr( 'id' );
			playlistChanged( event.data.app );
		}	 
	}

    $(".nano").nanoScroller();
}

function updateSelects( app )
{
	if ( app.selection1 != null )
	{
		$(".but1").removeClass('selected-playlist');
		$("#" + app.selection1 ).addClass('selected-playlist');
	}
	if ( app.selection2 != null )
	{
        $(".but2").removeClass('selected-playlist');
        $("#" + app.selection2 + '.but2' ).addClass('selected-playlist');
	}
}