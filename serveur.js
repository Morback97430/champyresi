const express = require('express');
const app = express();
const router = express.Router();
const path = require('path');

const server = app.listen(3000,() => {
    console.log('Serveur en cour 3000!');
});

let io = require('socket.io')(server);
module.exports = io;

let client = require('./client');

io.on('connection', (socket) => {
  client.setupSocket(socket);
  client.sendEtat();
});

//gestionChampignon.launch("COM14");

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
      app.render(path.join(__dirname + '/public', 'index'), 
      (err, html) => {
        renderedViews += html;
        res.send(renderedViews)
      }
    );
    }
  );
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