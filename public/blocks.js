
var VALUES = ["Boolean", "Number", "String", "Array", "Value", "Null"];

function inject_code(name, fields, values, blocks) {
  /**
   * Handle basic block function construction into JSON-generating
   * code blocks.
   */
  Blockly.JavaScript[name] = function (block) {
    let obj = block_to_obj(block, name, fields, values, blocks)
    let obj_str = blockobj_to_json(name, block, obj)
    return obj_str
  }
}

function value_to_obj(block, name) {
  let field = Blockly.JavaScript.valueToCode(
    block, name, Blockly.JavaScript.ORDER_ATOMIC
  ).replace(/,$/, '');
  if (field !== null && field !== "") {
    field = JSON.parse(field.replace(/,$/, ''));
  } else {
    field = null;
  }
  return field;
}

function block_to_obj(block, name, fields, values, blocks) {
  let obj = {
    type: name
  };
  fields = fields || []
  values = values || []
  blocks = blocks || []

  for (let i = 0; i < fields.length; i++) {
    try {
      obj[fields[i]] = block.getFieldValue(fields[i]);
    } catch (e) {
      console.error('Error processessing field: ' + values[i])
    }
  }
  for (let i = 0; i < values.length; i++) {
    try {
      obj[values[i]] = value_to_obj(block, values[i]);
    } catch (e) {
      console.error('Error processessing value: ' + values[i], e)
    }
  }
  for (let i = 0; i < blocks.length; i++) {
    try {
      let statements = Blockly.JavaScript.statementToCode(
        block, blocks[i], Blockly.JavaScript.ORDER_NONE
      )
      statements = '[' + statements.replace(/,$/, '') + ']';
      obj[blocks[i]] = JSON.parse(statements);
    } catch (e) {
      console.error('Error processessing statement: ' + blocks[i], e)
    }
  }
  return obj
}

function blockobj_to_json(name, block, obj) {
  /**
   * Returns a string containing a statement wrapper around a json-style
   * object.
   */
  val = JSON.stringify(obj, null, '  ') + ',';
  if (!block.outputConnection) {
    return val;
  }
  return [
    val, Blockly.JavaScript.ORDER_ATOMIC
  ];
}

BLOCKS = {
  /****************************************************
   * FUNCTIONS
   ****************************************************/
  start: {
    init: function () {
      this.appendDummyInput()
        .appendField(" ⚑    Start                        ");
      this.appendStatementInput("statements")
        .setCheck(null);
      this.setInputsInline(false);
      this.setColour(120);
      this.setTooltip("");
      this.setHelpUrl("");
    },
    javascript: function (block) {
      let obj = block_to_obj(
        block, 'function', [], [], ['statements']
      );
      obj.name = 'start';
      obj.arguments = [];
      return blockobj_to_json('function', block, obj);
    }
  },
  on_command: {
    init: function () {
      this.appendDummyInput()
        .appendField("When spoken to: (text, speaker, position)");
      this.appendStatementInput("statements")
        .setCheck(null);
      this.setInputsInline(false);
      this.setColour(120);
      this.setTooltip("");
      this.setHelpUrl("");
    },
    javascript: function (block) {
      let obj = block_to_obj(
        block, 'function', [], [], ['statements']
      );
      obj.name = 'on_spoken_to';
      obj.arguments = ['text', 'speaker', 'position'];
      return blockobj_to_json('function', block, obj);
    }
  },
  function: {
    init: function () {
      this.appendValueInput("arguments")
        .setCheck(["argument"])
        .appendField("Function")
        .appendField(new Blockly.FieldTextInput("do_this"), "name")
        .appendField(" with:");
      this.appendStatementInput("statements")
        .setCheck(null);
      this.setInputsInline(false);
      this.setColour(120);
      this.setTooltip("");
      this.setHelpUrl("");
    },
    javascript: function (block) {
      let obj = block_to_obj(
        block, 'function', ['name'], ['arguments', 'return'], ['statements']
      );
      let argument = obj.arguments;
      let args = []
      while (argument) {
        args.push(argument.name)
        argument = argument.argument;
      }
      obj.arguments = args;
      return blockobj_to_json('function', block, obj);
    }
  },
  argument: {
    init: function () {
      this.appendValueInput("argument")
        .setCheck(["argument"])
        .appendField("argument")
        .appendField(new Blockly.FieldTextInput("x"), "name");
      this.setOutput(true, "argument");
      this.setColour(345);
      this.setTooltip("");
      this.setHelpUrl("");
    },
    fields: ["name"],
    values: ['argument'],
  },
  assign: {
    init: function () {
      this.appendValueInput("val")
        .setCheck(VALUES)
        .appendField("Set")
        .appendField(new Blockly.FieldTextInput("my_var"), "name")
        .appendField("to");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(230);
      this.setTooltip("");
      this.setHelpUrl("");
    },
    fields: ['name'],
    values: ['val']
  },
  global_assign: {
    init: function () {
      this.appendValueInput("val")
        .setCheck(VALUES)
        .appendField("Set global")
        .appendField(new Blockly.FieldTextInput("my_var"), "name")
        .appendField("to");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(230);
      this.setTooltip("");
      this.setHelpUrl("");
    },
    fields: ['name'],
    values: ['val']
  },
  return: {
    init: function () {
      this.appendValueInput("val")
        .setCheck(VALUES)
        .appendField("Return")
      this.setPreviousStatement(true, null);
      this.setColour(230);
      this.setTooltip("");
      this.setHelpUrl("");
    },
    fields: ['name'],
    values: ['val']
  },
  call: {
    init: function () {
      this.appendDummyInput();
      this.appendValueInput("args")
        .setCheck(["Array", "Value"])
        .appendField("Call")
        .appendField(new Blockly.FieldTextInput("do_this"), "function")
        .appendField("(");
      this.appendDummyInput()
        .appendField(")");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(75);
      this.setTooltip("");
      this.setHelpUrl("");
    },

    fields: ['function'],
    values: ['args'],
  },
  call_inline: {
    init: function () {
      this.appendDummyInput();
      this.appendValueInput("args")
        .setCheck(null)
        .appendField("Call")
        .appendField(new Blockly.FieldTextInput("do_this"), "function")
        .appendField("(");
      this.appendDummyInput()
        .appendField(")");
      this.setOutput(true, VALUES);
      this.setInputsInline(true);
      this.setColour(75);
      this.setTooltip("");
      this.setHelpUrl("");
    },
    fields: ['function'],
    values: ['args'],
  },
  /****************************************************
   * BOT
   ****************************************************/

  delay: {
    init: function () {
      this.appendValueInput("val")
        .setCheck(VALUES)
        .appendField("Timeout for");
      this.appendDummyInput()
        .appendField("Seconds");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(165);
      this.setTooltip("Pause execution for _ seconds");
      this.setHelpUrl("");
    },

    values: ['val'],
  },
  speak: {
    init: function () {
      this.appendValueInput("val")
        .setCheck(VALUES)
        .appendField("Say ")
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(165);
      this.setTooltip("");
      this.setHelpUrl("");
    },
    values: ['val'],
  },
  move: {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ["Walk forward", "forward"],
          ["Walk backward", "back"],
          ["Walk left", "left"],
          ["Walk right", "right"],
          ["Start Jumping", "jump"],
          ["Sprint", "sprint"],
          ["Sneak", "sneak"]
        ]), "action");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(165);
      this.setTooltip("");
      this.setHelpUrl("");
    },
    javascript: function (block) {
      let obj = block_to_obj(block, 'control', ['action'], [], []);
      obj.val = true;
      return blockobj_to_json('control', block, obj);
    }
  },
  stop: {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ["Stop walking forward", "forward"],
          ["Stop walking backward", "back"],
          ["Stop walking left", "left"],
          ["Stop walking right", "right"],
          ["Stop jumping", "jump"],
          ["Stop sprinting", "sprint"],
          ["Stop sneaking", "sneak"]
        ]), "action");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(165);
      this.setTooltip("");
      this.setHelpUrl("");
    },
    javascript: function (block) {
      let obj = block_to_obj(block, 'control', ['action'], [], []);
      obj.val = false;
      return blockobj_to_json('control', block, obj);
    }
  },
  jump: {
    init: function () {
      this.appendDummyInput()
        .appendField("Jump")
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(165);
      this.setTooltip("");
      this.setHelpUrl("");
    },

  },
  stop_all: {
    init: function () {
      this.appendDummyInput()
        .appendField("Stop")
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(165);
      this.setTooltip("");
      this.setHelpUrl("");
    },

  },
  turn: {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ["Turn left ⟲", "L"],
          ["Turn right ⟳", "R"]
        ]), "dir");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(165);
      this.setTooltip("");
      this.setHelpUrl("");
    },
    fields: ['dir'],
  },
  face: {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ["Face North", "N"],
          ["Face South", "S"],
          ["Face East", "E"],
          ["Face West", "W"],
        ]), "dir");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(165);
      this.setTooltip("");
      this.setHelpUrl("");
    },
    fields: ['dir'],
  },
  rotate: {
    init: function () {
      this.appendValueInput("val")
        .setCheck(["Number", "Value"])
        .appendField("Turn");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(165);
      this.setTooltip("");
      this.setHelpUrl("");
    },
    values: ['val'],
  },

  goto: {
    init: function () {
      this.appendValueInput("pos")
        .appendField("Go to")
        .setCheck(["Value", "Array"]);
      this.setInputsInline(true);
      this.setOutput(true, "Boolean");
      this.setColour(230);
      this.setTooltip("");
      this.setHelpUrl("");
    },
    values: ['pos']
  },

  /****************************************************
   * CONSTANTS
   ****************************************************/
  const: {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ["True", "true"],
          ["False", "false"],
          ["Null", "null"]
        ]), "val");
      this.setOutput(true, ["Boolean", "Null"]);
      this.setColour(300);
      this.setTooltip("");
      this.setHelpUrl("");
    },
    javascript: function (block) {
      var obj = block_to_obj(block, 'const', ['val']);
      obj.val = JSON.parse(obj.val);
      return blockobj_to_json('const', block, obj);
    }
  },

  num: {
    init: function () {
      this.appendDummyInput()
        .appendField("(")
        .appendField(new Blockly.FieldTextInput("0"), "val")
        .appendField(")")
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(300);
      this.setTooltip("");
      this.setHelpUrl("");
    },
    javascript: function (block) {
      var obj = block_to_obj(block, 'const', ['val']);
      obj.val = Number(obj.val);
      return blockobj_to_json('const', block, obj);
    }
  },

  str: {
    init: function () {
      this.appendDummyInput()
        .appendField("\"")
        .appendField(new Blockly.FieldTextInput("str"), "val")
        .appendField("\"");
      this.setInputsInline(true);
      this.setOutput(true, "String");
      this.setColour(300);
      this.setTooltip("");
      this.setHelpUrl("");
    },
    javascript: function (block) {
      var obj = block_to_obj(block, 'const', ['val']);
      return blockobj_to_json('const', block, obj);
    }
  },

  to_string: {
    init: function () {
      this.appendValueInput("val")
        .appendField("String ")
        .setCheck(null);
      this.setInputsInline(true);
      this.setOutput(true, "String");
      this.setColour(230);
      this.setTooltip("");
      this.setHelpUrl("");
    },
    values: ['val']
  },

  to_number: {
    init: function () {
      this.appendValueInput("val")
        .appendField("Number ")
        .setCheck(null);
      this.setInputsInline(true);
      this.setOutput(true, "String");
      this.setColour(230);
      this.setTooltip("");
      this.setHelpUrl("");
    },
    values: ['val']
  },

  /****************************************************
   * LOGIC
   ****************************************************/

  loop: {
    init: function () {
      this.appendDummyInput()
        .appendField("Repeat forever");
      this.appendStatementInput("statements")
        .setCheck(VALUES);
      this.setColour(270);
      this.setTooltip("");
      this.setHelpUrl("");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
    },
    statements: ['statements']

  },

  while: {
    init: function () {
      this.appendValueInput("condition")
        .setCheck(VALUES)
        .appendField("While");
      this.appendStatementInput("statements")
        .setCheck(null);
      this.setColour(270);
      this.setTooltip("");
      this.setHelpUrl("");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
    },
    values: ['condition'],
    statements: ['statements']

  },

  if: {
    init: function () {
      this.appendValueInput("condition")
        .setCheck(VALUES)
        .appendField("If");
      this.appendStatementInput("statements")
        .setCheck(null);
      this.setColour(270);
      this.setTooltip("");
      this.setHelpUrl("");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
    },
    values: ['condition'],
    statements: ['statements']
  },

  if_else: {
    init: function () {
      this.appendValueInput("condition")
        .setCheck(null)
        .appendField("If");
      this.appendStatementInput("statements")
        .setCheck(VALUES);
      this.appendDummyInput()
        .appendField("Else");
      this.appendStatementInput("else_statements")
        .setCheck(VALUES);
      this.setColour(270);
      this.setTooltip("");
      this.setHelpUrl("");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
    },
    values: ['condition'],
    statements: ['statements', 'else_statements']
  },
  log: {
    init: function () {
      this.appendValueInput("val")
        .setCheck(VALUES)
        .appendField("Log ")
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(230);
      this.setTooltip("");
      this.setHelpUrl("");
    },
    values: ['val'],
  },

  get: {
    init: function () {
      this.appendDummyInput()
        .appendField("Variable")
        .appendField(new Blockly.FieldTextInput("my_var"), "name");
      this.setOutput(true, ["Null", "Value"]);
      this.setColour(230);
      this.setTooltip("");
      this.setHelpUrl("");
    },
    fields: ['name']
  },
  global_get: {
    init: function () {
      this.appendDummyInput()
        .appendField("Global variable")
        .appendField(new Blockly.FieldTextInput("my_var"), "name");
      this.setOutput(true, ["Null", "Value"]);
      this.setColour(230);
      this.setTooltip("");
      this.setHelpUrl("");
    },
    fields: ['name']
  },

  /****************************************************
   * Arrays
   ****************************************************/

  list_push: {
    init: function () {
      this.appendValueInput("val")
        .setCheck(VALUES)
        .appendField("Push ")
      this.appendValueInput("arr")
        .setCheck(["Array", "Value"])
        .appendField(" into ")
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setInputsInline(true);
      this.setColour(230);
      this.setTooltip("");
      this.setHelpUrl("");
    },
    values: ['val', 'arr'],
  },

  list_pop: {
    init: function () {
      this.appendValueInput("arr")
        .setCheck(["Array", "Value"])
        .appendField("Pop ")
      this.setOutput(true, ["Null", "Value"]);
      this.setColour(230);
      this.setTooltip("Removes and returns the last item in the array");
      this.setHelpUrl("");
    },
    values: ['val'],
  },

  array_read: {
    init: function () {
      this.appendValueInput("arr")
        .setCheck(["Array", "Value"])
        .appendField("Read ")
      this.appendValueInput("offset")
        .setCheck(["Number", "Value"])
        .appendField("[")
      this.appendDummyInput()
        .appendField("]")
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setInputsInline(true);
      this.setColour(230);
      this.setTooltip("");
      this.setHelpUrl("");
    },
    values: ['val'],
  },

  array_write: {
    init: function () {
      this.appendValueInput("arr")
        .setCheck(["Array", "Value"])
        .appendField("Read ")
      this.appendValueInput("offset")
        .setCheck(["Number", "Value"])
        .appendField("[")
      this.appendDummyInput()
        .appendField("]")
      this.appendValueInput("val")
        .setCheck(VALUES)
        .appendField("[")
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setInputsInline(true);
      this.setColour(230);
      this.setTooltip("");
      this.setHelpUrl("");
    },
    values: ['val'],
  },

  /****************************************************
   * Functions
   ****************************************************/

  math_op: {
    init: function () {
      this.appendValueInput("left")
        .setCheck(null);
      this.appendValueInput("right")
        .setCheck(null)
        .appendField(new Blockly.FieldDropdown([
          ["+", "add"],
          ["-", "sub"],
          ["×", "mult"],
          ["÷", "div"],
          ["^", "pow"]
        ]), "op");
      this.setInputsInline(true);
      this.setOutput(true, null);
      this.setColour(230);
      this.setTooltip("");
      this.setHelpUrl("");
    },
    fields: ['op'],
    values: ['left', 'right']
  },

  comp: {
    init: function () {
      this.appendValueInput("left")
        .setCheck(null);
      this.appendValueInput("right")
        .setCheck(null)
        .appendField(new Blockly.FieldDropdown([
          ["=", "eq"],
          [">", "gt"],
          ["<", "lt"],
          ["≥", "gte"],
          ["≤", "lte"],
          ["!=", "neq"]
        ]), "op");
      this.setInputsInline(true);
      this.setOutput(true, null);
      this.setColour(230);
      this.setTooltip("");
      this.setHelpUrl("");
    },
    fields: ['op'],
    values: ['left', 'right']
  },

  logic: {
    init: function () {
      this.appendValueInput("left")
        .setCheck(null);
      this.appendValueInput("right")
        .setCheck(null)
        .appendField(new Blockly.FieldDropdown([
          ["and", "and"],
          ["or", "or"]
        ]), "op");
      this.setInputsInline(true);
      this.setOutput(true, null);
      this.setColour(230);
      this.setTooltip("");
      this.setHelpUrl("");
    },
    fields: ['op'],
    values: ['left', 'right']
  },

  not: {
    init: function () {
      this.appendValueInput("val")
        .appendField("Not")
        .setCheck(null);
      this.setOutput(true, null);
      this.setColour(230);
      this.setTooltip("");
      this.setHelpUrl("");
    },
    fields: ['op'],
    values: ['left', 'right']
  }
};



Object.keys(BLOCKS).forEach(function (key, index) {
  Blockly.Blocks[key] = { init: BLOCKS[key].init };
  if (BLOCKS[key].javascript !== undefined) {
    Blockly.JavaScript[key] = BLOCKS[key].javascript;
  } else {
    inject_code(key, BLOCKS[key].fields, BLOCKS[key].values, BLOCKS[key].statements);
  }
});

