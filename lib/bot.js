/**
 * The primary bot code.
 */

var mineflayer = require('mineflayer');
const bot_commands = require('./bot_commands');
const mineflayer_nav = require('mineflayer-navigate')(mineflayer);
const structures = require('./classes');

var Bot = structures.Bot;
var Scope = structures.Scope;
var Context = structures.Context;

var BOTS_DISABLED = false;
var TICK_DELAY = 20;

BOTS = [];
FUNCTIONS = {};

/**
 * disable_bots()
 * Startup argument to disable bots from being created.
 * 
 * Allows troubleshooting of locic without minecraft integration.
 */
exports.disable_bots = function () {
  BOTS_DISABLED = true;
  console.log("Bots disabled.");
};

/**
 * Returns an array of bot names.
 */
exports.get_bots = function () {
  var names = [];
  BOTS.forEach(bot => {
    names.push(bot.name);
  });
  return names;
};

/**
 * Startup option for tick delay.
 * 
 * @param {Number} ticks 
 */
exports.set_tick = function (ticks) {
  TICK_DELAY = ticks;
};

/**
 * Add a function to the bot's library of functions.
 * 
 * @param {*} func 
 */
exports.set_function = function (func) {
  FUNCTIONS[func.name] = func;
};


/**
 * Activate any idle bots to run the start function.
 */
exports.activate_bots = function () {
  if (FUNCTIONS.start === undefined) {
    return;
  }
  BOTS.forEach(bot => {
    if (bot.scopes.length == 0) {
      exports.set_bot(bot.name, 'start');
    }
  });
};

/**
 * Create a bot, add them to the bot collection, and begin
 * execution.
 * 
 * @param {*} options 
 */
exports.create_bot = function (options) {
  bot_name = options.name || 'bot';
  create_bot_options = {
    username: bot_name
  };
  fields = ['host', 'port', 'password'];
  fields.forEach(element => {
    if (options[element] !== undefined) {
      create_bot_options[element] = options[element];
    }
  });
  var bot_instance = null;

  var nav_status = {
    path_length: 0,
    is_navigating: false,
    had_trouble: false
  };

  if (!BOTS_DISABLED) {
    bot_instance = mineflayer.createBot(create_bot_options);
    mineflayer_nav(bot_instance);
    bot_instance.on('spawn', function () {
      console.log('Spawned ' + bot_name);
      exports.set_bot(bot_name, 'start');
    });

    bot_instance.navigate.on('pathFound', function (path) {
      nav_status.path_length = path.length;
    });
    bot_instance.navigate.on('cannotFind', function (closestPath) {
      nav_status.had_trouble = true;
      nav_status.path_length = closestPath.length;
      bot_instance.navigate.walk(closestPath);
    });
    bot_instance.navigate.on('arrived', function () {
      nav_status.is_navigating = false;
    });
    bot_instance.navigate.on('interrupted', function() {
      nav_status.had_trouble = true;
      nav_status.is_navigating = false;
    });
    bot_instance.on('chat', (username, message) => {
      if (username === bot_instance.username) return;
      if (FUNCTIONS.on_spoken_to === undefined) return;
      let speaker = null;
      let position = null;
      Object.keys(bot_instance.entities).forEach(key => {
        let ent = bot_instance.entities[key];
        if (ent.username == username) {
          speaker = ent;
          position = [ent.position.x, ent.position.y, ent.position.z];
        }
      });
      
      bot.call_function('on_spoken_to', [message, username, position]);
    });
  } else {
    exports.set_bot(bot_name, 'start');
  }
  var bot = new Bot(bot_name, bot_instance, nav_status);
  BOTS.push(bot);
};

/**
 * Sets a bot to stop all activity and start the given function.
 * 
 * @param {string} bot_name 
 * @param {string} func_name 
 */
exports.set_bot = function (bot_name, func_name) {
  if (FUNCTIONS[func_name] === undefined) {
    console.log("Unrecognized function " + func_name + ", quiting.");
    return;
  }
  var bot;
  for (var i = 0; i < BOTS.length; i++) {
    if (BOTS[i].name == bot_name) {
      bot = BOTS[i];
    }
  }
  if (!bot) {
    console.log("Unrecognized bot " + bot_name + ", quiting.");
    return;
  }
  if (bot.timer !== null) clearTimeout(bot.timer);

  bot.scopes = [];
  console.log('Set ' + bot_name + ' execution to ' + func_name);
  bot.call_function(func_name);
  bot.timer = setInterval(bot_tick, TICK_DELAY, bot);
};

/**
 * Sets up a call scope on a given bot for the given bot function.
 * 
 * @param {object} bot 
 * @param {string} func 
 */
call_bot_func = function (bot, func) {
  var args = [];
  for (let i = 2; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  var vars = {};
  var func_args = func.arguments || [];

  for (let i = 0; i < func_args.length; i++) {
    vars[func_args[i]] = (i < args.length) ? args[i] : null;
  }

  bot.scopes.push(new Scope(func, vars));
};

/**
 * Executes a bot "tick" - runs one statement.
 * 
 * @param {*} bot 
 */
function bot_tick(bot) {
  if (bot.scopes.length == 0) {
    return;
  }

  // retrive the current function scope
  var scope = bot.get_scope();
  var context = scope.get_context();

  // do we need to close out the current context?
  if (context.is_complete()) {
    scope.stmt_contexts.pop();
    if (scope.stmt_contexts.length == 0) {
      // out of scopes, done with the function
      bot.scopes.pop();
      return;
    }
    context = scope.stmt_contexts[scope.stmt_contexts.length - 1];
  }
  var stmt = context.get_stmt();
  var result;
  try {
    result = call_bot_stmt(bot, stmt, context, scope.vars);
  } catch (err) {
    if (err instanceof bot_commands.CallFunction) {
      context.target_field = err.path;
      return;
    } else if (err instanceof bot_commands.Waiting) {
      return;
    }
    console.log(typeof err, err);
    bot.scopes = [];
    return;
  }

  // handle result values
  if (result === null || result === undefined) { // normal execution
    context.increment();
  } else if (result instanceof Context) {
    context.cleanup();
    scope.stmt_contexts.push(result);
  } else if (result instanceof Array) {
    if (result[0] == 'return') {
      let ret = null;
      if (result.length == 2) {
        ret = result[1];
      }
      bot.scopes.pop();
      if (bot.scopes.length == 0) {
        return;
      }
      let target = bot.get_scope().get_context();
      if (target.target_field !== null) {
        target.fields[target.target_field] = ret;
      }
      return;
    }
    context.cleanup();
    if (result[0] == 'hold') {
      return;
    }
  }
}

function call_bot_stmt(bot, stmt, context, vars) {
  if (bot_commands.statements.hasOwnProperty(stmt.type)) {
    return bot_commands.statements[stmt.type](bot, stmt, context, vars);
  }
  throw new Error("Unrecognized statement: " + stmt.type);
}
