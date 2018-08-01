const fs = require('fs');
var source = fs.readFileSync('test.jpg');
var typedArray = new Uint8Array(source);
const Module = require('dbrjs');
Module.onRuntimeInitialized = function() {
    let dbr = new Module.BarcodeReaderWasm("t0068NQAAAKTSQDbEid8CTEeNluhTXi+h35G8R03xIHsyYNzZoa2GiU2a8y7s5Z1lfHsMW5dNyZmH6jQL51HUcoB5EhpDeDk=");
    console.time('wasm');
    let results = dbr.DecodeFileInMemory(typedArray, "");
    console.timeEnd('wasm');
    let json = JSON.parse(results);
    let barcodeResults = json['textResult'];
    let txts = [];
    for (let i = 0; i < barcodeResults.length; ++i) {
        txts.push(Buffer.from(barcodeResults[i].BarcodeText, 'base64').toString('ascii'));
      }
    console.log(txts.join(", "));
};
