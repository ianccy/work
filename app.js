var express = require('express');
var app = express();
var mysql      = require('mysql');

var engine = require('ejs-locals');
app.engine('ejs',engine);
app.set('views','./views');
app.set('view engine','ejs');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database: 'test'
});

var data = {};
connection.query('select * from MyGuests', function(err, rows, fields) {
  if (err) throw err;
  data.user = rows[0];
});

app.get('/', function(req, res){
  res.render('index');
});

app.get('/about', function(req, res){
  res.render('about',{data: data.user});
});

// check running enviroment
var port = process.env.PORT || 3000;

app.listen(port);

if(port === 3000){
  console.log('RUN http://localhost:3000/')
}