//declare our dependencies
var express = require('express');
var request = require('superagent');

//create our express app
var app = express();

//set the view engine to use EJS as well as set the default views directory
app.set('view engine', 'ejs');
app.set('views', __dirname + '/public/views/');

//this tells Express out of which directory to serve static assets like CSS and images
app.use(express.static(__dirname + '/public'));

//these two variables we'll get from our Auth0 movieanalyst-website client.
//head over the management dashboard at https://manage.auth0.com
//find the MovieAnalyst Website Client and copy and paste the client
var NON_INTERACTIVE_CLIENT_ID = 'Gln7F3W3AaWRcV8zPbEKWTBq8Odv1PUk';
var NON_INTERACTIVE_CLIENT_SECRET = 'nYdmG6dh_yI_xDFr05WvOqxjM64YL8-wEv1FVSwFwCQxbwqyB0IE-tzv8srXB50p';

//next, we'll define an object that we'll use to exchange our credentials for an access token
var authData = {
	client_id: NON_INTERACTIVE_CLIENT_ID,
	client_secret: NON_INTERACTIVE_CLIENT_SECRET,
	grant_type: 'client_credentials',
	audience: 'https://movieanalyst.com'
}

//we'll create a middleware to make a request to the oauth/token Auth0 API with our authData we created earlier.
//our data will be validated and if everything is correct, we'll get back an access token.
//we'll store this token in the req.access_token variable and continue the request execution.
//it may be repetitive to call this endpoint each time and not very performant, so you can cache the access_token once it is received.
function getAccessToken(req, res, next) {
	request
		.post('https://leonard-ata.auth0.com/oauth/token')
		.send(authData)
		.end(function(err, res) {
			if(req.body.access_token) {
				req.access_token = res.body.access_token;
				next();
			} else {
				res.send(401, 'Unauthorized');
			}
		})
}

// the homepage route of our application does not interface with the  MovieAnalyst API and is always accessible. We won't use the getAccessToken middleware here. We'll simply render the index.ejs view.
app.get('/', function(req, res) {
	res.render('index');
})

//the process will be the same for the remaining routes. We'll make sure to get the access_token first and then make the request to our API to get the data.
//the key difference on the authors route, is that for our client, we're naming the route /authors, but our API endpoint is /reviewers. Our route on the client does not have to match the API endpoint route.
app.get('/authors', getAccessToken, function(req, res) {
	request
		.get('http://localhost:8080/reviewers')
		.set('Authorization', 'Bearer ' + req.access_token)
		.end(function(err, data) {
			if(data.status == 403) {
				res.send(403, '403 Forbidden');
			} else {
				var authors = data.body;
				res.render('authors', {authors : authors});
			}
		})
})

//we've added the pending route, but calling this route from the MovieAnalyst Website will always result in a 403 forbidden error because this client does not have the admin scope required to get the data.
app.get('/pending', getAccessToken, function(req, res) {
	request
		.get('http://localhost:8080/pending')
		.set('Authorization', 'Bearer' + req.access_token)
		.end(function(err, data) {
			if(data.status == 403) {
				res.send(403, '403 Forbidden');
			}
		})
})

//our movie analyst website will listen on port 3000.
app.listen(4000);












