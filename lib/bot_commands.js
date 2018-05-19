const util = require('./util');
var vec3 = require('vec3');
var bot_lib = require('./bot');
const structures = require('./classes');
var Context = structures.Context;

/**
 * Raised when a function is added to the stack.
 * 
 * @param {*} path 
 * @param {*} context 
 */
exports.CallFunction = function (path, context) {
  this.path = path;
  this.context = context;
};

/**
 * Raised when waiting for an event to clear.
 */
exports.Waiting = function (context) {
  this.context = context;
};

function call_bot_field(bot, field, vars, context, path) {
  if (context.fields.hasOwnProperty(path)) {
    return context.fields[path];
  }
  func = exports.fields[field.type];
  if (func !== undefined) {
    var val = func(bot, field, vars, context, path);
    context.fields[path] = val;
    return val;
  }
  throw new Error("Unrecognized field: " + field.type);
}

exports.statements = {
  loop: function (bot, stmt, context, vars) {
    context.vars.is_loop = true;
    return new Context(stmt.statements);
  },
  while: function (bot, stmt, context, vars) {
    if (call_bot_field(bot, stmt.condition, vars, context, '0')) {
      context.vars.is_loop = true;
      return new Context(stmt.statements);
    }
    delete context.vars.is_loop;
  },
  if: function (bot, stmt, context, vars) {
    if (context.vars.is_conditional === true) {
      delete context.vars.is_conditional;
      return;
    }
    if (call_bot_field(bot, stmt.condition, vars, context, '0')) {
      context.vars.is_condition = true;
      return new Context(stmt.statements);
    }
  },
  if_else: function (bot, stmt, context, vars) {
    if (context.vars.is_conditional === true) {
      delete context.vars.is_conditional;
      return;
    }
    context.vars.is_condition = true;
    if (call_bot_field(bot, stmt.condition, vars, context, '0')) {
      return new Context(stmt.statements);
    } else {
      return new Context(stmt.else_statements);
    }
  },
  speak: function (bot, stmt, context, vars) {
    let val = call_bot_field(bot, stmt.val, vars, context, '0');
    bot.instance.chat(String(val));
  },
  control: function (bot, stmt, context, vars) {
    bot.instance.setControlState(stmt.action, stmt.val);
  },
  stop_all: function (bot, stmt, context, vars) {
    bot.instance.clearControlStates();
  },
  delay: function (bot, stmt, context, vars) {
    var val;
    if (context.vars.end_at === undefined) {
      val = call_bot_field(bot, stmt.val, vars, context, '0');
      context.vars.end_at = Date.now() + (1000 * val);
    }
    if (Date.now() <= context.vars.end_at) {
      return ['hold'];
    }
    delete context.vars.end_at;
  },
  jump: function (bot, stmt, context, vars) {
    bot.instance.setControlState('jump', true);
    bot.instance.setControlState('jump', false);
  },
  turn: function (bot, stmt, context, vars) {
    var val = bot.instance.entity.yaw + Math.PI / 2 * (stmt.dir == 'L' ? 1 : -1);
    if (val < 0) {
      val += Math.PI * 2;
    } else if (val > 2 * Math.PI) {
      val -= Math.PI * 2;
    }
    bot.instance.look(val, 0);
  },
  rotate: function (bot, stmt, context, vars) {
    var val = call_bot_field(bot, stmt.val, vars, context, '0');
    val = bot.instance.entity.yaw + val / 180 * Math.PI;
    while (val < 0) {
      val += Math.PI * 2;
    }
    while (val > 2 * Math.PI) {
      val -= Math.PI * 2;
    }
    bot.instance.look(val, 0);
  },
  face: function (bot, stmt, context, vars) {
    var val;
    if (stmt.dir == 'W') {
      val = Math.PI / 2;
    } else if (stmt.dir == 'N') {
      val = 0;
    } else if (stmt.dir == 'E') {
      val = -1 * Math.PI / 2;
    } else if (stmt.dir == 'S') {
      val = Math.PI;
    } else {
      console.log("Unrecognized direction: ", stmt.dir);
    }
    bot.instance.look(val, 0);
  },
  log: function (bot, stmt, context, vars) {
    console.log(call_bot_field(bot, stmt.val, vars, context, '0'));
  },
  assign: function (bot, stmt, context, vars) {
    vars[stmt.name] = call_bot_field(bot, stmt.val, vars, context, '0');
  },
  global_assign: function (bot, stmt, context, vars) {
    bot.globals[stmt.name] = call_bot_field(bot, stmt.val, vars, context, '0');
  },
  call: function (bot, stmt, context, vars) {
    let args = stmt.args.map((arg, i) => call_bot_field(
      bot, arg, vars, context, String(i)));
    bot.call_function(stmt.name, args);
  },
  return: function (bot, stmt, context, vars) {
    var val = call_bot_field(bot, stmt.val, vars, context, '0');
    return ['return', val];
  }
};

exports.fields = {
  const: function (bot, field, vars, context, path) {
    return field.val;
  },
  get: function (bot, field, vars, context, path) {
    return vars[field.name];
  },
  global_get: function (bot, field, vars, context, path) {
    return bot.globals[field.name];
  },
  math_op: function (bot, field, vars, context, path) {
    var left = call_bot_field(bot, field.left, vars, context, path + '.left');
    var right = call_bot_field(bot, field.right, vars, context, path + '.right');
    
    return util.safe_math(left, right, field.op);
  },
  comp: function (bot, field, vars, context, path) {
    var left = call_bot_field(bot, field.left, vars, context, path + '.left');
    var right = call_bot_field(bot, field.right, vars, context, path + '.right');
    if (field.op == 'eq') {
      return left === right;
    }
    if (field.op == 'lt') {
      return left < right;
    }
    if (field.op == 'gt') {
      return left > right;
    }
    if (field.op == 'lte') {
      return left <= right;
    }
    if (field.op == 'gte') {
      return left >= right;
    }
    if (field.op == 'neq') {
      return left !== right;
    }
    throw new Error("Unrecognized operation: " + field.op); 
  },
  logic: function (bot, field, vars, context, path) {
    var left = call_bot_field(bot, field.left, vars, context, path + '.left');
    if (field.op == 'and' && !left) {
      return false;
    }
    if (field.op == 'or' && left) {
      return true;
    }
    var right = call_bot_field(bot, field.right, vars, context, path + '.right');
    return Boolean(right);
  },
  not: function (bot, field, vars, context, path) {
    var val = call_bot_field(bot, field.val, vars, context, path + '.left');
    return ! Boolean(val);
  },
  list: function (bot, field, vars, context, path) {
    return [];
  },
  list_push: function (bot, field, vars, context, path) {
    var item = call_bot_field(bot, field.val, vars, context, path + '.0');
    var arr = call_bot_field(bot, field.arr, vars, context, path + '.1');


    if (!(arr instanceof Array)) {
      throw new Error("Expected Array in second push argument.");
    }
    arr.push(item);
  },
  list_pop: function (bot, field, vars, context, path) {
    var arr = call_bot_field(bot, field.arr, vars, context, path + '.0');

    if (!(arr instanceof Array)) {
      throw new Error("Expected Array in second push argument.");
    }
    return arr.pop();
  },

  bot_position: function (bot, field, vars, context, path) {
    var pos = bot.instance.entity.position;
    return [pos.x, pos.y, pos.z];
  },

  inspect_block: function (bot, field, vars, context, path) {
    var pos = bot.instance.entity.position;
    var yaw = bot.instance.entity.yaw;
    
    exports.fields.bot_position(bot, field, vars, context, path);
    // bot.instance.blockAt
  },

  goto: function (bot, field, vars, context, path) {
    var pos = call_bot_field(bot, field.pos, vars, context, path + '.0');
    if (context.vars.is_goto === undefined) {
      context.vars.is_goto = true;
      bot.goto(vec3(pos[0], pos[1], pos[2]));
      throw new exports.Waiting(context);
    }

    if  (bot.nav_status.is_navigating) {
      throw new exports.Waiting(context);
    } else {
      delete bot.nav_status.is_navigating;
      return bot.nav_status.had_trouble;
    }
  },

  to_string: function (bot, field, vars, context, path) {
    var val = call_bot_field(bot, field.val, vars, context, path + '.0');
    return String(val);
  },

  to_number: function (bot, field, vars, context, path) {
    var val = call_bot_field(bot, field.val, vars, context, path + '.0');
    return Number(val);
  },


  call_inline: function (bot, field, vars, context, path) {
    let args = field.args.map((arg, i) => call_bot_field(
      bot, arg, vars, context, path + '.' + String(i)));
    bot.call_function(field.name, args);
    throw new exports.CallFunction(path, context);
  }
};
