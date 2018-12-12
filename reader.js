var videoElement = document.querySelector('video');
var canvas = document.getElementById('pcCanvas');
var mobileCanvas = document.getElementById('mobileCanvas');
var ctx = canvas.getContext('2d');
var mobileCtx = mobileCanvas.getContext('2d');
var videoSelect = document.querySelector('select#videoSource');
var videoOption = document.getElementById('videoOption');
var buttonFile = document.getElementById('bt-file');
buttonFile.disabled = true;
var buttonVideo = document.getElementById('bt-video');
buttonVideo.disabled = true;
var barcode_result = document.getElementById('dbr');

var isPaused = false;
var videoWidth = 640,
  videoHeight = 480;
var mobileVideoWidth = 240,
  mobileVideoHeight = 320;
var isPC = true;

var reader;
Module.onRuntimeInitialized = function () {
  document.getElementById('anim-loading').style.display = 'none';
  buttonFile.disabled = false;
  buttonVideo.disabled = false;
  reader = new Module.BarcodeReaderWasm("t0068NQAAAJUlQ1oDc6zPWxOAQWn7kD9EGtgZFIqK/k3ULJC5ccG9Xe/lpVOxod82bm6nXxqQXUpC1zjRXU514mWw9XLE1JM=");
};

// https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
function b64DecodeUnicode(str) {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeURIComponent(atob(str).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}

// check devices
function browserRedirect() {
  var deviceType;
  var sUserAgent = navigator.userAgent.toLowerCase();
  var bIsIpad = sUserAgent.match(/ipad/i) == "ipad";
  var bIsIphoneOs = sUserAgent.match(/iphone os/i) == "iphone os";
  var bIsMidp = sUserAgent.match(/midp/i) == "midp";
  var bIsUc7 = sUserAgent.match(/rv:1.2.3.4/i) == "rv:1.2.3.4";
  var bIsUc = sUserAgent.match(/ucweb/i) == "ucweb";
  var bIsAndroid = sUserAgent.match(/android/i) == "android";
  var bIsCE = sUserAgent.match(/windows ce/i) == "windows ce";
  var bIsWM = sUserAgent.match(/windows mobile/i) == "windows mobile";
  if (bIsIpad || bIsIphoneOs || bIsMidp || bIsUc7 || bIsUc || bIsAndroid || bIsCE || bIsWM) {
    deviceType = 'phone';
  } else {
    deviceType = 'pc';
  }
  return deviceType;
}

if (browserRedirect() == 'pc') {
  isPC = true;
} else {
  isPC = false;
}

// stackoverflow: http://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata/5100158
function dataURItoBlob(dataURI) {
  // convert base64/URLEncoded data component to raw binary data held in a string
  var byteString;
  if (dataURI.split(',')[0].indexOf('base64') >= 0)
    byteString = atob(dataURI.split(',')[1]);
  else
    byteString = unescape(dataURI.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

  // write the bytes of the string to a typed array
  var ia = new Uint8Array(byteString.length);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ia], {
    type: mimeString
  });
}

// add button event
buttonFile.onclick = function () {
  let image = document.getElementById('uploadImage').files[0];
  if (image) {
    let fileReader = new FileReader();
    fileReader.onload = function (e) {
      let arrayBuffer = fileReader.result;
      try {
        let results = reader.DecodeFileInMemory(arrayBuffer, "");
        let json = JSON.parse(results);
        let barcodeResults = json['textResult'];
        let txts = [];
        for (let i = 0; i < barcodeResults.length; ++i) {
          txts.push(b64DecodeUnicode(barcodeResults[i].BarcodeText));
        }
        barcode_result.textContent = txts.join(", ");
      } catch (e) {
        console.log(e);
      }
    }
    fileReader.readAsArrayBuffer(image);
  } 

};

buttonVideo.onclick = function () {
  buttonVideo.disabled = true;
  if (isPC) {
    canvas.style.display = 'none';
  } else {
    mobileCanvas.style.display = 'none';
  }

  isPaused = false;
  scanBarcode();
};

// scan barcode
function scanBarcode() {
  barcode_result.textContent = "";

  let context = null,
    width = 0,
    height = 0,
    dbrCanvas = null;

  if (isPC) {
    context = ctx;
    width = videoWidth;
    height = videoHeight;
    dbrCanvas = canvas;
  } else {
    context = mobileCtx;
    width = mobileVideoWidth;
    height = mobileVideoHeight;
    dbrCanvas = mobileCanvas;
  }

  context.drawImage(videoElement, 0, 0, width, height);

  var vid = document.getElementById("video");
  console.log("video width: " + vid.videoWidth + ", height: " + vid.videoHeight);
  var barcodeCanvas = document.createElement("canvas");
  barcodeCanvas.width = vid.videoWidth;
  barcodeCanvas.height = vid.videoHeight;
  var barcodeContext = barcodeCanvas.getContext('2d');
  var imageWidth = vid.videoWidth,
    imageHeight = vid.videoHeight;
  barcodeContext.drawImage(videoElement, 0, 0, imageWidth, imageHeight);
  // read barcode
  var imageData = barcodeContext.getImageData(0, 0, imageWidth, imageHeight);
  var idd = imageData.data;

  let results;
  try {
    results = reader.DecodeBuffer(idd.buffer, imageWidth, imageHeight, imageWidth * 4, 7, "");
  } catch (e) {
    console.log(e);
  }

  if (!results) {
    setTimeout(scanBarcode, 30);
  } else {
    let json = JSON.parse(results);
    let barcodeResults = json['textResult'];
    if (barcodeResults.length == 0) {
      setTimeout(scanBarcode, 30);
    } else {
      buttonVideo.disabled = false;
      let txts = [];
      for (let i = 0; i < barcodeResults.length; ++i) {
        if (barcodeResults[i].LocalizationResult.ExtendedResultArray[0].Confidence >= 30) {
          txts.push(b64DecodeUnicode(barcodeResults[i].BarcodeText));
        }
      }
      if (txts.length == 0) {
        setTimeout(scanBarcode, 30);
        console.log("No confident results");
      } else {
        barcode_result.textContent = txts.join(", ");
        buttonVideo.disabled = false;
        if (isPC) {
          canvas.style.display = 'block';
        } else {
          mobileCanvas.style.display = 'block';
        }
      }
    }
  }

}

// https://github.com/samdutton/simpl/tree/gh-pages/getusermedia/sources 
navigator.mediaDevices.enumerateDevices()
  .then(gotDevices).then(getStream).catch(handleError);

videoSelect.onchange = getStream;

function gotDevices(deviceInfos) {
  for (var i = deviceInfos.length - 1; i >= 0; --i) {
    var deviceInfo = deviceInfos[i];
    var option = document.createElement('option');
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === 'videoinput') {
      option.text = deviceInfo.label || 'camera ' +
        (videoSelect.length + 1);
      videoSelect.appendChild(option);
    } else {
      console.log('Found one other kind of source/device: ', deviceInfo);
    }
  }
}

function getStream() {
  if (window.stream) {
    window.stream.getTracks().forEach(function (track) {
      track.stop();
    });
  }

  var constraints = {
    video: {
      deviceId: {
        exact: videoSelect.value
      }
    }
  };

  navigator.mediaDevices.getUserMedia(constraints).
  then(gotStream).catch(handleError);
}

function gotStream(stream) {
  window.stream = stream; 
  videoElement.srcObject = stream;
}

function handleError(error) {
  console.log('Error: ', error);
}