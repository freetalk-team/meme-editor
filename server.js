
const express = require('express')
	, logger = require('morgan')
	, { join } = require('path')
	;

const kPort = process.env.PORT || 3013;
const kPublic = join(__dirname, 'public');

const production = process.env.NODE_ENV == 'production';

var app = express();

// configure Express
app.use(express.static(kPublic));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs')

app.use(logger('dev', { skip: function (req, res) { return res.statusCode < 400 } }));

app.disable('x-powered-by');

// api
// app.use('/', (req, res) => res.sendFile('index.html', { root: kPublic }));
app.use('/', (req, res) => res.render('index', { production, electron: false }));

app.listen(kPort, async function() {
	console.log('Express server listening on port', kPort);
});
