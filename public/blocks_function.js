
Blockly.Blocks.dynamic_function = {
  /**
   * Block for creating a list with any number of elements of any type.
   * @this Blockly.Block
   */
  init: function () {
    this.name_ = 'My Function';

    this.length_ = 0;
    let field = this.appendDummyInput('HEADER');
    this.setFirstField(field);
    this.updateShape_()

    this.appendStatementInput("statements")
      .setCheck(null);
    this.setInputsInline(false);
    this.setColour(120);
  },

  /**
   * Modify this block to have the correct number of inputs.
   * @private
   * @this Blockly.Block
   */
  updateShape_: function () {
    // Add new inputs.
    let i = 0;
    let input = this.getInput("HEADER");
    while (true) {
      value = this.getFieldValue("ARG" + i);
      if (value && i >= this.length_) {
        input.removeField("ARG" + i);
      } else if (!value && i < this.length_) {
        input.appendField(new Blockly.FieldTextInput("arg" + (i+1)), "ARG" + i);
      } else if (!value && i>= this.length_) {
        break;
      }
      i += 1;
    }
    this.attachListener();
  },

  setFirstField: function (field) {
    field.appendField(new Blockly.FieldImage("/static/img/plus_white.png", 15, 15, "+"))
    field.appendField(new Blockly.FieldImage("/static/img/minus_white.png", 15, 15, "-"))
    field.appendField("Call function")
    field.appendField(new Blockly.FieldTextInput(this.name_), "name")
  },

  setSvgRoot: function (svg_root) {
    this.svg_root = svg_root;
    this.attachListener();
  },

  attachListener: function () {
    if (this.svg_root === undefined) {
      return;
    }
    Array.from(this.svg_root.getElementsByTagName('image')).forEach(img => {
      if (img.hasAttribute('_handler')) {
        return;
      }
      img.setAttribute('_handler', '1');
      let href = img.getAttribute('xlink:href');
      let delta = 0;
      if (href.indexOf('img/minus_white.png') != -1) {
        delta = -1;
      } else if (href.indexOf('img/plus_white.png') != -1) {
        delta = 1;
      } else {
        return;
      }
      img.style.cursor = 'pointer';
      img.addEventListener('mousedown', e => {
        this.length_ += delta;
        if (this.length_ < 0) {
          this.length_ = 0;
        }
        this.updateShape_();
      });
    });
    return;
  },

  /**
   * Create XML to represent list inputs.
   * @return {!Element} XML storage element.
   * @this Blockly.Block
   */
  mutationToDom: function () {
    var container = document.createElement('mutation');
    container.setAttribute('items', this.length_);
    return container;
  },
  /**
   * Parse XML to restore the list inputs.
   * @param {!Element} xmlElement XML storage element.
   * @this Blockly.Block
   */
  domToMutation: function (xmlElement) {
    this.length_ = parseInt(xmlElement.getAttribute('items'), 10);
    this.updateShape_();
  }
};


Blockly.JavaScript.dynamic_function = function (block) {
  let obj = block_to_obj(block, 'function', ['name'], [], ['statements']);
  obj.arguments = [];
  for (let i=0; i<block.length_; i++) {
    obj.arguments.push(block.getFieldValue("ARG" + i));
  }
  return blockobj_to_json('function', block, obj);
}
