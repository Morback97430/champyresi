const express = require('express');
const app = express();
const router = express.Router();
const path = require('path');

const server = app.listen(3000,() => {
  console.log('Example app listening on port 3000!');
});

const io = require('socket.io')(server);
const serialPort = require('serialport');

const Arduino = require('./arduino');
let arduino = new Arduino(serialPort);

const Client = require('./client');
let client = new Client(arduino);

io.on('connection', (socket) => {
  client.newConnection(socket);
});

var cons = require('consolidate');

// view engine setup
app.engine('html', cons.swig)
app.set('public', path.join(__dirname, '/public'));
app.set('view engine', 'html');

router.get('/', (req, res) => {
  res.type('html');
  let renderedViews = ""
  // res.sendFile(path.join(__dirname + '/public', 'paramArduino.html'));
  app.render(path.join(__dirname + '/public', 'header'),
    (err, html) => {
      renderedViews += html;
      app.render(path.join(__dirname + '/public', 'home'), 
        (err, html) => {
          renderedViews += html;
          res.send(renderedViews)
        }
      );
    }
  )
});

router.get('/paramArduino', (req, res) =>
{
  res.type('html');
  let renderedViews = ""
  // res.sendFile(path.join(__dirname + '/public', 'paramArduino.html'));
  app.render(path.join(__dirname + '/public', 'header'),
    (err, html) => {
      renderedViews += html;
      app.render(path.join(__dirname + '/public', 'paramArduino'), 
        (err, html) => {
          renderedViews += html;
          res.send(renderedViews)
        }
      );
    }
  )
});

app.use(
  express.static(__dirname + '/public')
);

app.use('/', router);