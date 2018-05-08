
Blockly.Blocks.dynamic_call = {
  /**
   * Block for creating a list with any number of elements of any type.
   * @this Blockly.Block
   */
  init: function () {
    this.name_ = 'My Function';
    this.length_ = 0;
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.updateShape_()
    this.setColour(75);
  },

  /**
   * Modify this block to have the correct number of inputs.
   * @private
   * @this Blockly.Block
   */
  updateShape_: function () {
    this.setName_();
    if (this.length_ && this.getInput('EMPTY')) {
      this.removeInput('EMPTY');
    } else if (!this.length_ && !this.getInput('EMPTY')) {
      let field = this.appendDummyInput('EMPTY');
      this.setFirstField(field);
    }
    // Add new inputs.
    for (var i = 0; i < this.length_; i++) {
      if (!this.getInput('ADD' + i)) {
        var input = this.appendValueInput('ADD' + i);
        if (i == 0) {
          this.setFirstField(input);
        }
      }
    }
    // Remove deleted inputs.
    while (this.getInput('ADD' + i)) {
      this.removeInput('ADD' + i);
      i++;
    }
    this.attachListener();
  },

  setName_: function() {
    if (this.getFieldValue && this.getFieldValue("name")) {
      this.name_ = this.getFieldValue("name");
    }
    this.name_ = 'My Function';
  },

  setFirstField: function (field) {
    field.appendField(new Blockly.FieldImage("/static/img/plus_white.png", 15, 15, "+"))
    field.appendField(new Blockly.FieldImage("/static/img/minus_white.png", 15, 15, "-"))
    field.appendField("Call function")
    field.appendField(new Blockly.FieldTextInput(this.name_), "name");
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


Blockly.JavaScript.dynamic_call = function (block) {
  let obj = block_to_obj(block, 'call', ['name'], [], []);
  obj.args = [];
  for (let i=0; i<block.length_; i++) {
    obj.args.push(value_to_obj(block, "ADD" + i));
  }
  return blockobj_to_json('call', block, obj);
}

