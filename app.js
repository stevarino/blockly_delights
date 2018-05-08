const express = require('express')
const body_parser = require('body-parser');
const bot_lib = require('./lib/bot')
var program = require('commander');

program
  .version('1.0.0')
  .option('-n, --no-bots', 'Disable bots for troubleshooting.')
  .option('-h, --host [host]', 'Specify host name to use - defaults to localhost.', 'localhost')
  .option('-p, --port [port]', 'Specify port to use - defaults to 3000.', parseInt, 3000)
  .option('-t, --tick [ms]', 'Bot tick delay in milliseconds, defaults to 20.', 20)
  .parse(process.argv);

if (!program.bots) {
  bot_lib.disable_bots();
}
bot_lib.set_tick(program.tick);

const app = express()

const port = 3000;

app.use('/static', express.static(__dirname + '/public'));
app.use(body_parser.json({ type: 'application/json' }));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/index.html')
})

app.post('/upload', function (request, response) {
  request.body.code.forEach(element => {
    if (element.type === 'function') {
      bot_lib.set_function(element);
    }
  });
  if (request.body.exec == 0) {
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
  console.log('Server is running at http://%s:%s', program.host, program.port)
});
