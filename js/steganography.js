Object.size = function (obj) {
    var size = 0;
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            size += 1;
        }
    }
    return size;
};

Object.getKeyByValue = function(obj, value) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop)) {
            if(obj[prop] === value) {
                return prop;
            }
        }
    }
}

// namespace using module pattern
var myNameSpace = (function () {
    var priv = 0,
        WIDTH = 100,
        HEIGHT = 100,
        imagePaths = {
            red: 'images/red.png',
            blue: 'images/blue.png',
            striped: 'images/striped.png',
            stripedCopy: 'images/striped-copy.png'
        },
        buffer = document.createElement('canvas');

    buffer.width = WIDTH;
    buffer.height = HEIGHT;

    var bufferCtx = buffer.getContext('2d');

    function init() {
        loadImages(imagePaths, addEventHandlers);
    }

    function addEventHandlers(images) {
        $('.imageDecode').off().on('click', function (e) {
            console.log('decode an image');
        });

        $('.imageEncode').off().on('click', function (e) {
            var path = 'images/' + e.target.src.split('/').pop(),
                key = Object.getKeyByValue(imagePaths, path);
            console.log('Encode an image: ' + path, key);
            // TODO: trigger encoding
            // TODO: get the secret message from page
            encodeMessageIntoImage($('#message').val(), images[key]);
        });
    }

    function loadImages(imagePaths, callback) {
        var images = {},
            loadedImages = 0,
            numImages = Object.size(imagePaths);

        for (var fileName in imagePaths) {
            images[fileName] = new Image();
            images[fileName].onload = function () {
                loadedImages += 1;
                if (loadedImages >= numImages) {
                    callback(images);
                }
            };
            images[fileName].src = imagePaths[fileName];
        }
    }

    function encodeMessageIntoImage(message, image) {
        var charCodes = [];
        for (var idx = 0; idx < message.length; idx += 1) {
            charCodes.push(message.charCodeAt(idx));
        }
        //~ messageToEightBitBinary(message);

        var imageData = getImageDataViaCanvas(image, buffer);
        encodeMessageInImageData(message, imageData);
        bufferCtx.putImageData(imageData, 0, 0);
        copyCanvasToImagePlaceHolder(buffer);
    }

    // draw image to canvas, then get data (no direct way to do it)
    function getImageDataViaCanvas(image, canvas) {
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return imageData;
    }

    function copyCanvasToImagePlaceHolder(canvas) {
        var dataURL = canvas.toDataURL();
        document.getElementById('imagePlaceHolder').src = dataURL;
    }

    function encodeMessageInImageData(message, imageData) {
        var eightBitBinary = messageToEightBitBinary(message),
            flattened = [].concat.apply([], eightBitBinary),
            len = eightBitBinary.length * 8;

        for (var idx = 0; idx < len; idx += 1) {
            imageData.data[idx] += flattened[idx] + 1;
        }
    }

    function extractMessageFromImageData(changed, original) {
        var changes = getChangesBetweenImageData(changed, original);
        return eightBitBinaryToText(changes);
    }

    // return changes between image data as pseudo bit array
    function getChangesBetweenImageData(changed, original) {
        var changes = [],
            difference;
        for (var idx = 0; idx < original.data.length; idx += 1) {
            difference = Math.abs(changed.data[idx] - original.data[idx]);
            if (difference === 0) {
                return normaliseBinaryArray(changes);
            }
            changes.push(difference);
        }
        return normaliseBinaryArray(changes);
    }

    // convert arrays like [1,1,2,1,2,2,2] to [0,0,1,0,1,1,1]
    function normaliseBinaryArray(almostBinaryArray) {
        var binaryArray = [];
        for (var idx = 0; idx < almostBinaryArray.length; idx += 1) {
            binaryArray.push(almostBinaryArray[idx] - 1);
        }
        return binaryArray;
    }

    // parse 8 bit binary aray (aligned to word boundary) to text
    function eightBitBinaryToText(binaryArray) {
        var message = '';
        for (var idx = 0; idx < binaryArray.length; idx += 8) {
            //~ binaryArray[idx]
            message += binaryArrayToChar(binaryArray.slice(idx, idx + 8));
        }
        return message;
    }

    // parse 8 bit binary array into a character
    function binaryArrayToChar(eightBitBinaryArray) {
        assert(eightBitBinaryArray.length === 8, 'binaryArrayToChar: expect 8 bit ' +
                'binary, got ' + eightBitBinaryArray.length);
        var decimal = parseInt(eightBitBinaryArray.join(''), 2);
        return String.fromCharCode(decimal);
    }

    // turn string into binary representation of each char code
    function messageToEightBitBinary(message) {
        var charCode,
            asEightBit = [];

        for (var idx = 0; idx < message.length; idx += 1) {
            charCode = message.charCodeAt(idx);
            asEightBit.push(decimalToBinaryArray(charCode));
        }
        return asEightBit;
    }

    // decimal to binary array (padded to 8 bits)
    // 11 => [0,0,0,0,1,0,1,1]
    // correct for 0 <= num <= 255
    function decimalToBinaryArray(num) {
        var binaryString = '00000000' + num.toString(2),
            binaryArray;

        binaryString = binaryString.slice(-8);
        binaryArray = binaryString.split('');

        for (var idx = 0; idx < binaryArray.length; idx += 1) {
            binaryArray[idx] = parseInt(binaryArray[idx], 10);
        }
        return binaryArray;
    }

    function assert(condition, message) {
        if (!condition) {
            throw new Error("ASSERTION FAIL: " + message);
        }
    }

    return {
        init: init,
        encodeMessageInImageData: encodeMessageInImageData,
        extractMessageFromImageData: extractMessageFromImageData,
        getChangesBetweenImageData: getChangesBetweenImageData,
        messageToEightBitBinary: messageToEightBitBinary
    };
})();

// dev functions, will not remain

//~ function compareImages(imageA, imageB, canvas) {
    //~ var imageDataA = getImageDataViaCanvas(imageA, canvas);
    //~ var imageDataB = getImageDataViaCanvas(imageB, canvas);
    //~ isImageDataSame(imageDataA, imageDataB);
//~ }
//~
//~ function isImageDataSame(imageDataA, imageDataB) {
    //~ // check dimensions match
    //~ if (imageDataA.width !== imageDataB.width ||
        //~ imageDataA.height !== imageDataB.height) {
            //~ console.log('Dimensions do not match for images.');
            //~ return false;
    //~ }
//~
    //~ // check pixels match
    //~ for (var idx = 0; idx < imageDataA.data.length; idx += 1) {
        //~ if (imageDataA.data[idx] !== imageDataB.data[idx]) {
            //~ console.log('the data does not match at idx: ' + idx);
            //~ return false;
        //~ }
    //~ }
    //~ console.log('images match!');
    //~ return true;
//~ }
//~
//~ function encryptionDemo(sjcl) {
    //~ var message = 'This is the secret message',
        //~ password = 'RedRockApple',
        //~ encryptedMessage = sjcl.encrypt(password, message),
        //~ decryptedMessage = sjcl.decrypt(password, encryptedMessage),
        //~ serializedEncrypted = JSON.stringify(encryptedMessage),
        //~ deserializedEncrypted = JSON.parse(serializedEncrypted),
        //~ finalMessage = sjcl.decrypt(password, deserializedEncrypted);
//~
    //~ console.log('encrypted: ' + encryptedMessage);
    //~ console.log('decrypted: ' + decryptedMessage);
    //~ console.log('message: ' + message);
    //~ console.log('serializedEncrypted: ' + serializedEncrypted);
    //~ console.log('deserializedEncrypted: ' + deserializedEncrypted);
    //~ console.log('finalMessage: ' + finalMessage);
//~ }
