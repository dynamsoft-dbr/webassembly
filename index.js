const fs = require('fs');
var source = fs.readFileSync('test.jpg');
var typedArray = new Uint8Array(source);
const Module = require('dbrjs');
Module.onRuntimeInitialized = function() {
    let dbr = new Module.BarcodeReaderWasm("t0068NQAAAJUlQ1oDc6zPWxOAQWn7kD9EGtgZFIqK/k3ULJC5ccG9Xe/lpVOxod82bm6nXxqQXUpC1zjRXU514mWw9XLE1JM=");
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
