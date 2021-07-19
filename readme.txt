Install notes

1. Download Git repo and do npm -install 
2. Change default-credentials.js to just credentials.js and fill in client id and secret from Spotify API
3. Change callbackURL in api.js to your own domain, set to localhost atm
4. Clone and run my playlist-frontend repo to have Frontend + Backend


About
Backend built with ExpressJS, SimpleOauth and Axios to handle searching
the Spotify API for playlists, picking out each track information and merge that with 
another search for each track's Audio Features (tempo, energy, valence etc). This data
is then sent to a /search endpoint. 

The project is at the moment unfinished. All error handling is for instance not implemented,
as well as auto renewal for the spotify token.
