
Blockly.Blocks.list = {
    /**
     * Block for creating a list with any number of elements of any type.
     * @this Blockly.Block
     */
    init: function () {
      this.length_ = 0;
      this.updateShape_()
      this.setColour(300);
      this.setOutput(true, 'Array');
    },
  
    /**
     * Modify this block to have the correct number of inputs.
     * @private
     * @this Blockly.Block
     */
    updateShape_: function () {
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
  
    setFirstField: function(field) {
      field.appendField(new Blockly.FieldImage("/static/img/plus_white.png", 15, 15, "+"))
      field.appendField(new Blockly.FieldImage("/static/img/minus_white.png", 15, 15, "-"))
      field.appendField("List");
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
  
  
  Blockly.JavaScript.list = function (block) {
    let obj = {
      type: block.type,
      values: []
    };
    for (let i=0; i<block.length_; i++) {
      obj.values.push(value_to_obj(block, "ADD" + i));
    }
    return blockobj_to_json('function', block, obj);
  }
  