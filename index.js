//======================================================
// Application Requirements
//======================================================
const express = require('express')
const bodyParser = require('body-parser')

const app = express()
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.listen(3003)

app.engine('html', require('ejs').renderFile)
app.set('views', './views')
app.set('view engine', 'html')

const accountRouter = require('./api/account/account')

app.use ('/account', accountRouter)

//=======================================================
// HOME
//=======================================================
app.get('/', function (request, response) {
    response.render('pages/index');
  }
)

app.get('/fail', (request, response) => {
    response.render('pages/fail')
  }
)