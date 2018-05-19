const wrap = require("minecraft-wrap");
const path = require('path');
const fs = require("fs");
var extract = require('extract-zip');


var Anvil = require('prismarine-provider-anvil');
var Vec3 = require("vec3");

const nbt = require('prismarine-nbt');

var littleEndian = false;

const version = '1.12.2';
const server_path = path.join(__dirname, '..', 'server');
const resources_path = path.join(__dirname, '..', 'resources');

var server = null;
var anvilGen = null;
var isOnline = false;

function serverExists() {
    return fs.existsSync(getJarPath());
}

function establishServer() {
    return new Promise(function (resolve, reject) {
        download()
            .then(start)
            .then(resolve);
    });
}

function reset() {
    return new Promise(function (resolve, reject) {
        console.log("Resetting...");
        stop()
            .then(deleteData)
            .then(extractServerFile)
            .then(start)
            .then(resolve);
    });
}

function extractServerFile() {
    return new Promise(function (resolve, reject) {
        console.log("Extracting server.zip");
        var zip = path.join(resources_path, 'server.zip');
        extract(zip, { dir: server_path }, function (err) {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
}

function getServer() {
    if (server === null) {
        server = new wrap.WrapServer(getJarPath(), server_path, {
            'noOverride': true
        });
        server.on('line', function (line) {
            console.log("[Minecraft] " + line);
        });
    }
    return server;
}

function getJarPath() {
    return path.join(resources_path, 'server.' + version + '.jar');
}

function download() {
    return new Promise(function (resolve, reject) {
        if (serverExists()) {
            return resolve();
        }
        console.log("Donwloading server...");
        wrap.downloadServer(version, getJarPath(), function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}
function start() {
    return new Promise(function (resolve, reject) {
        if (!fs.existsSync(server_path)) {
            extractServerFile().then(start);
            return;
        }
        getServer().startServer({}, function (err) {
            if (err) {
                console.log(err);
                process.exit(1);
            }
            server.writeServer('/gamerule doDaylightCycle false\n');
            server.writeServer('/gamerule doWeatherCycle false\n');
            server.writeServer('/gamerule sendCommandFeedback false\n');
            server.writeServer('/time set day\n');
            server.writeServer('/weather clear 999999\n');
            console.log("Server Started!");
            isOnline = true;
            resolve();
        });
    });
}

function stop() {
    return new Promise(function (resolve, reject) {
        getServer().stopServer(function (err) {
            if (err) {
                reject(err);
                return;
            }
            isOnline = false;
            resolve();
        });
    });
}

function checkIsOnline() {
    return isOnline;
}

function deleteData() {
    return new Promise(function (resolve, reject) {
        getServer().deleteServerData(function (err) {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}

module.exports = {
    server_path: server_path,
    download: download,
    start: start,
    serverExists: serverExists,
    stop: stop,
    reset: reset,
    deleteData: deleteData,
    checkIsOnline: checkIsOnline,
    establishServer: establishServer
};
