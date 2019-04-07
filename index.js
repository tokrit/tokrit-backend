//======================================================
// Application Requirements
//======================================================
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

//======================================================
// Application Configuration
//======================================================
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Port Setup: Allow port to be set as ENV var
app.set('port', (process.env.PORT || 3003));
app.listen(app.get('port'), function() {
  console.log('TOKRIT node.js application is running on port', app.get('port'));
});

// Render views for testing purpose
app.engine('html', require('ejs').renderFile);
app.set('views', './views');
app.set('view engine', 'html');

//======================================================
// Controller Bindings
//======================================================
let accountController = require('./api/account/account');
// let announcementController = require('./api/announcement/announcement');

app.use('api/v1/account', accountController);
// app.use('api/v1/announcement', announcementController);

//=======================================================
// HOME
//=======================================================
app.get('/', (request, response) => {
    response.render('pages/index');
});

app.get('/fail', (request, response) => {
    response.render('pages/fail');
});