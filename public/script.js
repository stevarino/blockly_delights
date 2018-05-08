/**
 * Icons: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html#foreground.type=clipart&foreground.clipart=remove_circle_outline&foreground.space.trim=1&foreground.space.pad=0.05&foreColor=rgb(255%2C%20255%2C%20255)&backColor=rgb(96%2C%20125%2C%20139)&crop=0&backgroundShape=none&effects=none&name=minus_white
 */
var blocklyArea = document.getElementById('blocklyArea');
var blocklyDiv = document.getElementById('blocklyDiv');
var demoWorkspace = Blockly.inject(blocklyDiv,
    {
        media: '/static/blockly/media/',
        collapse: true,
        sounds: false,
        toolbox: document.getElementById('toolbox')
    });
var onresize = function (e) {
    // Compute the absolute coordinates and dimensions of blocklyArea.
    var element = blocklyArea;
    var x = 0;
    var y = 0;
    do {
        x += element.offsetLeft;
        y += element.offsetTop;
        element = element.offsetParent;
    } while (element);
    // Position blocklyDiv over blocklyArea.
    blocklyDiv.style.left = x + 'px';
    blocklyDiv.style.top = y + 'px';
    blocklyDiv.style.width = blocklyArea.offsetWidth + 'px';
    blocklyDiv.style.height = blocklyArea.offsetHeight + 'px';
};
window.addEventListener('resize', onresize, false);
onresize();
Blockly.svgResize(demoWorkspace);

// tab switch
let nodes = document.querySelectorAll("#menu .tab");
for (let i = 0; i < nodes.length; i++) {
    nodes[i].addEventListener('click', function (e) {
        let nodes = document.querySelectorAll("#menu .tab");
        for (let i = 0; i < nodes.length; i++) {
            nodes[i].classList.remove('active')
        }
        nodes = document.querySelectorAll("#extra>div");
        for (let i = 0; i < nodes.length; i++) {
            nodes[i].style['display'] = 'none'
        }
        e.target.classList.add('active')
        let pane = document.getElementById(
            e.target.innerText.toLowerCase() + "_pane")
        nodes[i].style['display'] = 'block'
    }, false);
}

demoWorkspace.addChangeListener(function (e) {
    if (e.type == Blockly.Events.CREATE) {
        let stack = [demoWorkspace.getBlockById(e.blockId)];
        while (stack.length > 0) {
            let block = stack.pop();
            let svg_root = block.getSvgRoot();
            svg_root.setAttribute("block_id", block.id);
            if (block.setSvgRoot !== undefined) {
                block.setSvgRoot(svg_root);
            }
            if (block.attachListener !== undefined) {
                block.attachListener();
            }
            stack = stack.concat(block.getChildren());
        }
    }
    var xml = Blockly.Xml.workspaceToDom(demoWorkspace);
    var xml_text = Blockly.Xml.domToText(xml);
    document.querySelector('#workspace_pane pre').innerText = format_xml(xml_text);
    window.localStorage.setItem('workspace', xml_text);


    let code = Blockly.JavaScript.workspaceToCode(demoWorkspace);
    var replaces = [[/;\n/g, '\n'], [/[,;]+\s*$/, ''], [/\n/g, '\n  ']];
    replaces.forEach(element => {
        code = code.replace(element[0], element[1]);
    });
    code = '[\n  ' + code + '\n]';
    document.querySelector('#code_pane pre').innerText = code;

    let success = false;
    try {
        parsed = JSON.parse(code);
        success = true;
    } catch (e) {
        console.error(e);
    }

});


function get_code() {
    let code = document.querySelector('#code_pane pre').innerText;
    try {
        parsed = JSON.parse(code);
        return code;
    } catch (e) {
        console.error(e);
    }
}

function upload_code(exec) {
    exec = exec === undefined ? 0 : exec;
    var code = get_code();
    code = '{"exec": ' + exec + ', "code": ' + code + '}';
    post_json('/upload', code);
}

document.getElementById("btn_compile").addEventListener(
    'click', () => { upload_code(0) }, false);
document.getElementById("upload").addEventListener(
    'click', () => { upload_code(0) }, false);
document.getElementById("upload_and_exec").addEventListener(
    'click', () => { upload_code(1) }, false);

var workspace_xml = window.localStorage.getItem('workspace')
if (workspace_xml) {
    document.querySelector('#workspace_pane pre').innerText = format_xml(workspace_xml);
    let xml = Blockly.Xml.textToDom(workspace_xml);
    Blockly.Xml.domToWorkspace(xml, demoWorkspace);
    Blockly.blo
}

document.getElementById('create_bot_form').onsubmit = function (e) {
    form_data = {
        name: document.getElementById('bot_name').value || 'bot',
        host: document.getElementById('bot_host').value || 'localhost',
        port: document.getElementById('bot_port').value || '25565'
    };
    if (document.getElementById('bot_name').value) {
        form_data.password = document.getElementById('bot_name').value;
    }
    post_json('/create-bot', JSON.stringify(form_data));
    return false;
}

function post_json(endpoint, doc) {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(doc);
}

function format_xml(xml_text) {
    var output = ''; // apparently concatenation is about twice as fast as array.join
    var re = /<(\/?)[^>]+(\/?)>|[^<]+/g;
    var level = 0;
    var match;
    while (match = re.exec(xml_text)) {
        if (match[0].indexOf("</") === 0) {
            level -= 1;
        }
        output += "\n" + "  ".repeat(level) + match[0];
        if (match[0].indexOf("<") === 0 && match[2] !== '/' && match[1] !== '/') {
            level += 1;
        }
    }
    return output.trim();
}
