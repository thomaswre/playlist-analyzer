'use strict';
// Settings and Confs
const express = require('express');

const PORT = process.env.PORT || 3000;
 
const axios = require('axios').default;

const cors = require('cors');
const { AuthorizationCode } = require('simple-oauth2');

const app = express();

const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.json());

// Makes it CORS friendly, handles a preflight check.
app.options('/search', cors());

const credentials = require('./credentials'); //  File with Spotify API account details

// Callback URL, change depending on local dev or domain hosted.
const callbackURL = 'http://localhost:3000/callback';

const frontendURL = 'http://localhost:8080';
// Auth
const oauth2 = new AuthorizationCode(credentials);

const authorizationUri = oauth2.authorizeURL({
  redirect_uri: callbackURL,
  scope: 'user-read-private user-read-email',
  state: '3(#0/!~',
});
  
// Initial page redirecting to Spotify
app.get('/auth', (req, res) => {
  
  console.log('/auth'); // Could use a middleware to console.log each route 
  
  res.redirect(authorizationUri);
});

// Callback service parsing the authorization token and asking for the access token
app.get('/callback', async (req, res) => {
  const code = req.query.code;

  
  const options = {
    code,
    redirect_uri: callbackURL
  };

 // Save the access token using try / catch

 try {

  const accessToken = await oauth2.getToken(options);

  console.log('type accessToken: ');
  console.log(typeof(accessToken));

  app.locals.token = accessToken;

  // Sets a cookie with the name "auth" with the token
  res.cookie('auth', accessToken, {httpOnly: true});
  console.log('req.cookies.auth: ' + JSON.stringify(req.cookies.auth));

 	return res.status(200).redirect(frontendURL);
  
 	
 } catch (error) {
   console.log('Access Token Error', error.message);
   return res.status(500.).send({message: 'Cannot obtain access token to Spotify'});
   
 }

});

app.post('/search', cors(), (req, res) => {

  // Frontend URL
  let origin = req.headers.origin;
  console.log('Origin: ' + origin);

  // What server am I coming from. Used to set correct links to backend Auth
  let host = req.headers.host;
  console.log('Host: ' + host);
  
  console.log("req.headers.origin: " + origin);

  let token = req.cookies.auth;
  console.log("token in /search with json.stringify:");
  console.log(JSON.stringify(token));

  let tokenobj = app.locals.token;
  // console.log('tokenobj in search: ');
  // console.log(JSON.stringify(tokenobj));

  if (!tokenobj) {
    console.log("Token false or null, sending noauth");
    return res.send({noauth: 'Not authenticated. Try <a href="http://' + host + '/auth">logging in</a>'});
  }
  
  // TODO: If token expired at the top. No search before token is approved and not undefined.
  // If expired, make a token.refresh and make sure cookie auth is updated.

  console.log("Logged in.");
  
	let playlistUrl = req.body.search;
  
  console.log("Playlist URL: " + playlistUrl);
  // Convert a regular playlistURL into the ID
	let playlistID = playlistUrl.replace(/:/g, '/').replace(/.*playlist\//, '')
      	.replace(/\?.*/, '');
  
  let trackIDs = '';

  console.log("playlistID: " + playlistID);
	
  console.log('search: is the token expired?');
  console.log(tokenobj.expired());

  // If token not expired, do the search

	if (!tokenobj.expired()) { 

    // console.log('access_token in search');
		// console.log(tokenobj.token.access_token);

    // console.log(Object.keys(tokenobj.token));

    let trackIDs = [];

		var searchOptions = {
          headers: { 'Authorization': 'Bearer ' + tokenobj.token.access_token},
          json: true
        };
    
    let AudiofeatConf = {
      url: 'https://api.spotify.com/v1/audio-features?ids=' + trackIDs,
      headers: { 'Authorization': 'Bearer ' + tokenobj.token.access_token},
      json: true
    };

    // Makes two Axios Get requests, combine the two requests, send them as the response

    let getTracks = async () => {
      let response;
      try {
        response = await axios('https://api.spotify.com/v1/playlists/' + playlistID + '/tracks', searchOptions);
      } catch(error) {

        console.log('Failed to get Playlist Tracks: ' + error);
        return res.send({failed: 'Failed to get Playlist tracks. Incorrect playlist URL?'});
      }
      
        
        // Retrieve every track ID from playlist and add to TrackIDs 
      response.data.items.forEach(track => { // Max 100 tracks, use slice to cut longer playlists?
        console.log("trackID: " + track.track.id);
        trackIDs.push(track.track.id);

      });
      let response2;
      try {
        response2 = await axios('https://api.spotify.com/v1/audio-features?ids=' + trackIDs.join(), AudiofeatConf);
      } catch(error) {
        console.log('Failed to get Audio Features: ' + error);
      }
      
      // Prints out the datastructure of the response items
      /*
      console.log(response.data.items);

      console.log(response2.data);
      */

      // Combines the audio features into every single track on the playlist
      let newresp = response.data.items;

      for(let i = 0; i < newresp.length; i++) {
        newresp[i].features = response2.data.audio_features[i];
 
      }
      
      res.send(newresp);

    }
    getTracks();
    

	}
  // If token has expired. Send link to re-authenticate. Could have refreshed it, but meh.
	else {
    console.log('Token expired. Sending login');
		res.send({noauth: 'Access token has expired. Try <a href="http://' + host + '/auth">logging in</a>'});
	}

});

// Used to manually clear cookie for session testing
app.get('/clear_cookie', function(req, res){
   res.clearCookie('auth');
   res.send('cookie: auth cleared');
});


app.get('/', (req, res) => {
  
	if (typeof tokenobj === 'undefined') {
		
    res.send({noauth: 'Not authenticated. Try <a href="/auth">logging in</a>'})
	}
	else {
		res.send({noauth: 'Heeeellooooooo auth!'});
	}

});

app.listen(PORT, () => {
  console.log('Express server started on port ' + PORT); // eslint-disable-line
});

