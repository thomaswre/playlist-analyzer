Install notes

1. Clone Git repo and do npm -install 
2. Fill in client id and secret from Spotify API 
3. Change callbackURL in api.js to your own domain, set to localhost atm
4. Clone and run my playlist-frontend repo to have Frontend + Backend


About
Backend built with ExpressJS, SimpleOauth and Axios to handle searching
the Spotify API for playlists, picking out each track information and merge that with 
another search for each track's Audio Features (tempo, energy, valence etc). This data
is then sent to a /search endpoint. 

The project is at the moment unfinished. For instance: 
* All error handling is not implemented
* Auto Renewal of the API token is not implemented
* Smooth Deployment after updates are not handled, ie, your client id/secret for instance that you entered will have to be re-entered.
