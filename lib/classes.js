
function Bot(name, instance, nav_status) {
  this.name = name;
  this.instance = instance;
  this.timer = null;
  this.scopes = [];
  this.globals = {};
  this.nav_status = nav_status;
}

Bot.prototype.get_scope = function () {
  return this.scopes[this.scopes.length - 1];
}

Bot.prototype.call_function = function (func_name, args) {
  if (!FUNCTIONS.hasOwnProperty(func_name)) {
    console.log('Unrecognized function: ', func_name);
    throw new Error('Unrecognized function: ' + func_name);
  }
  var func = FUNCTIONS[func_name];
  var vars = {};
  var func_args = func.arguments || [];

  for (let i = 0; i < func_args.length; i++) {
    vars[func_args[i]] = (i < args.length) ? args[i] : null;
  }

  this.scopes.push(new Scope(func, vars));
};

Bot.prototype.goto = function (pos) {
  this.instance.navigate.to(pos);
  this.nav_status.path_length = 0;
  this.nav_status.is_navigating = true;
  this.nav_status.had_trouble = false;
};

/**
 * A Scope is a function memory space.
 * 
 * @param {*} func 
 * @param {*} vars 
 */
function Scope(func, vars) {
  this.func = func;
  this.vars = vars;
  this.stmt_contexts = [];
}

Scope.prototype.get_context = function () {
  if (this.stmt_contexts.length == 0) {
    this.stmt_contexts.push(new Context(this.func.statements));
  }
  return this.stmt_contexts[this.stmt_contexts.length - 1];
}

Scope.prototype.is_complete = function () {
  return this.stmt_contexts.length == 0;
}

/**
 * A Context is a block of statements.
 * 
 * @param {*} stmts 
 */
function Context(stmts) {
  this.stmts = stmts;
  this.ptr = 0;
  this.vars = {};
  this.fields = {};
  this.target_field = null;
}

Context.prototype.get_stmt = function () {
  return this.stmts[this.ptr];
}
Context.prototype.increment = function () {
  this.cleanup();
  this.ptr += 1;
}
Context.prototype.is_complete = function () {
  return this.stmts.length == this.ptr;
}
Context.prototype.cleanup = function () {
  this.target_field = null;
  this.fields = {};
}

exports.Context = Context;
exports.Scope = Scope;
exports.Bot = Bot;
