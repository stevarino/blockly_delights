const express = require('express')
const body_parser = require('body-parser');
const bot_lib = require('./lib/bot');
const mc_server = require('./lib/server');
var program = require('commander');

program
  .version('0.1.0')
  .option('-n, --no-bots', 'Disable bots for troubleshooting.')
  .option('-h, --host [host]', 'Specify host name to use - defaults to localhost.', 'localhost')
  .option('-p, --port [port]', 'Specify port to use - defaults to 3000.', parseInt, 3000)
  .option('-t, --tick [ms]', 'Bot tick delay in milliseconds, defaults to 20.', 20)
  .option('-d, --disable_mc_server', 'Disable minecraft server')
  .parse(process.argv);

if (!program.bots) {
  bot_lib.disable_bots();
}
bot_lib.set_tick(program.tick);

if (!program.disable_mc_server) {
  mc_server.establishServer();
}

const app = express()

const port = 3000;

app.use('/static', express.static(__dirname + '/public'));
app.use(body_parser.json({ type: 'application/json' }));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/index.html')
});

app.get('/status', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({
    'server': mc_server.checkIsOnline()
  }));
});

app.get('/reset', function (req, res) {
  mc_server.reset().then(function() {
    res.send('okay');
  });
});

app.post('/upload', function (req, res) {
  req.body.code.forEach(element => {
    if (element.type === 'function') {
      bot_lib.set_function(element);
    }
  });
  if (req.body.exec == 0) {
    bot_lib.activate_bots();
  } else {
    bot_lib.get_bots().forEach(botname => {
      bot_lib.set_bot(bot_name, 'start');
    });
  }
});

app.post('/create-bot', function (request, response) {
  bot_lib.create_bot(request.body);
});

app.listen(program.port, program.host, () => {
  console.log('Web Server is running at http://%s:%s', program.host, program.port)
});

function exitHandler(options, err) {
  console.log('Shutting down...');
  mc_server.stop();
  if (err) console.log(err.stack);
  if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
