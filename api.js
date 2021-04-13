'use strict';
// Settings and Confs
const express = require('express');
const request = require('request'); 
const axios = require('axios').default;
const { AuthorizationCode } = require('simple-oauth2');
const mustacheExpress = require('mustache-express');

const app = express();

// Serve static files in Express
app.use(express.static('public'));

app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));


const credentials = require('./credentials'); //  File with Spotify API account details

// Callback URL, change depending on local dev or domain hosted.
const callbackURL = 'http://localhost:3000/callback';

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

 	return res.status(200).cookie('auth', accessToken, {httpOnly: true}).redirect('/');
  
 	
 } catch (error) {
   console.log('Access Token Error', error.message);
   return res.status(500.).render(index.html, {message: 'Cannot obtain access token to Spotify'});
   
 	 
 }


});


app.post('/search', (req, res) => {

  let token = req.cookies.auth;
  let tokenobj = app.locals.token;

  if (!tokenobj) {
    return res.redirect('/');
  }
  
  // If token expired at the top. No search before token is approved and not undefined.
  // If expired, make a token.refresh and make sure cookie auth is updated.
	let playlistUrl = req.body.search;
  // Convert a regular playlistURL into the ID
	let playlistID = playlistUrl.replace(/:/g, '/').replace(/.*playlist\//, '')
      	.replace(/\?.*/, '');


	
  console.log('search: is the token expired?');
  console.log(tokenobj.expired());

  // If active token, do the search

	if (!tokenobj.expired()) { 

		// console.log(token);
		var searchOptions = {
          url: 'https://api.spotify.com/v1/playlists/' + playlistID + '/tracks',
          headers: { 'Authorization': 'Bearer ' + token['access_token'] },
          json: true
        };

        axios(searchOptions)
          .then(response => {
            console.log(response);
            res.render('index', {data: response.data});
          })
          .catch(error => console.error('axios error'));

        



	}
  // If token has expired. TODO: Refresh it.
	else {

		res.status(403).send('Not authenticated. Try <a href="/auth">logging in</a>');
	}

});

// Used to manually clear cookie for session testing
app.get('/clear_cookie', function(req, res){
   res.clearCookie('auth');
   res.send('cookie: auth cleared');
});

app.get('/', (req, res) => {

  let tokenobj = app.locals.token;
  console.log(tokenobj);

	if (typeof tokenobj === 'undefined') {


		// console.log("req.cookies.auth", req.cookies.auth);
		
    res.render('index', {message: 'Not authenticated. Try <a href="/auth">logging in</a>'})
	}
	else {
		res.render('index', {message: 'Heeeellooooooo auth!'});
	}

});

app.listen(3000, () => {
  console.log('Express server started on port 3000'); // eslint-disable-line
});

