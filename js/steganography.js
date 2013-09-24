var capensis = capensis || {
    WIDTH: 250,
    HEIGHT: 250,
    imagePaths: {
        image01: 'images/image01.png',
        image02: 'images/image02.png',
        image03: 'images/image03.png',
        image04: 'images/image04.png',
        image05: 'images/image05.png',
        image06: 'images/image06.png',
        image07: 'images/image07.png',
        image08: 'images/image08.png',
        encoded: 'images/encoded.png'
    },
    significantBits: [0, 1, 2, 4, 5, 6, 8, 9]
};

capensis.setup = capensis.setup || {};

capensis.setup.init = function () {
    capensis.buffer = document.createElement('canvas'),
    capensis.buffer.width = capensis.WIDTH;
    capensis.buffer.height = capensis.HEIGHT;
    capensis.bufferCtx = capensis.buffer.getContext('2d');
    capensis.setup.loadImages(capensis.setup.addEventHandlers);
}

// load images, then call callback
capensis.setup.loadImages = function (callback) {
    var imagePaths = capensis.imagePaths,
        images = {},
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

// TODO: image alpha values must always be opaque (255)
// check and notify user if image unsuitable
capensis.setup.addEventHandlers = function (images) {
    $('.imageDecode').off().on('click', function (e) {
        var changed = images.encoded,
            original = getImageObjFromHtmlImageSrc(images, e.target.src),
            message = capensis.decode.messageFromImages(changed, original);

        $('#messagePlaceHolder').text(message);
        $('#decodedModal').modal();
    });

    $('.imageEncode').off().on('click', function (e) {
        var image = getImageObjFromHtmlImageSrc(images, e.target.src);
            message = $('#message').val();

        capensis.encode.messageIntoImage(message, image);
        $('#encodedModal').modal();
    });

    function getImageObjFromHtmlImageSrc(images, src) {
        var path = 'images/' + src.split('/').pop(),
            key = Object.getKeyByValue(capensis.imagePaths, path);
        return images[key];
    }
}

//----------------------------------------------------------------------------

// to get image data for a loaded Image object we need to go via a canvas
capensis.extractImageData = function (image) {
    var ctx = capensis.buffer.getContext('2d'),
        width = capensis.buffer.width,
        height = capensis.buffer.height;

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0);
    return ctx.getImageData(0, 0, width, height);
}

//----------------------------------------------------------------------------

capensis.encode = capensis.encode || {};

// encode a mesage into an image and add the encoded image to the DOM
capensis.encode.messageIntoImage = function (message, image) {
    // get the imageData of the image to be used for encoding
    var imageData = capensis.extractImageData(image),
        dataURL;

    // put the message into the imageData
    capensis.encode.encodeMessageInImageData(message, imageData);

    // add the now encoded image to the canvas and get its contents as a dataURL
    capensis.bufferCtx.putImageData(imageData, 0, 0);
    dataURL = capensis.buffer.toDataURL();

    // put the image in the DOM within an img tag (not in a canvas)
    // this can be saved by the user with right-click
    document.getElementById('imagePlaceHolder').src = dataURL;
}

// store the message as a difference to image data
capensis.encode.encodeMessageInImageData = function (message, imageData) {
    var storeByte = capensis.encode.storeByte,
        bytes = capensis.encode.stringToBytes(message),
        byteIdx = 0,
        rgbIdx = 0;

    for (byteIdx = 0; byteIdx < bytes.length; byteIdx += 8) {
        storeByte(imageData, rgbIdx, bytes.slice(byteIdx, byteIdx + 8));
        rgbIdx += 12;
    }
}

// turn string into array of 8 bit bytes
capensis.encode.stringToBytes = function (message) {
    var charCode,
        bytes = [];

    for (var idx = 0; idx < message.length; idx += 1) {
        charCode = message.charCodeAt(idx);
        bytes = bytes.concat(decimalToByte(charCode))
    }
    return bytes;

    // convert decimal (0..255) to (padded) 8 bit byte array
    // 11 => [0,0,0,0,1,0,1,1]
    function decimalToByte(num) {
        var assert = capensis.assert;
        assert(0 <= num && num <= 255, 'decimalToByte: bad num ' + num);

        var binaryString = '00000000' + num.toString(2),
            byte = binaryString.slice(-8).split('');

        for (var idx = 0; idx < byte.length; idx += 1) {
            byte[idx] = parseInt(byte[idx], 10);
        }
        return byte;
    }
}

// one 8 bit byte is stored in 3 pixels, which is 12 elements of data
// c = changed, x = unchanged, a = alpha (a also unchanged)
// c,c,c,a,c,c,c,a,c,c,x,a
capensis.encode.storeByte = function(imageData, threePxBoundary, byte) {
    var significantBits = capensis.significantBits;
    for (var idx = 0; idx < significantBits.length; idx += 1) {
        storeBit(imageData, threePxBoundary + significantBits[idx], byte[idx]);
    }

    // store bit as difference, add or subtract to keep within 0..255
    function storeBit(imageData, imageDataIdx, bit) {
        var negate = imageData.data[imageDataIdx] > 254 ? -1 : 1;
        imageData.data[imageDataIdx] += bit * negate;
    }
}

//----------------------------------------------------------------------------

capensis.decode = capensis.decode || {};

capensis.decode.messageFromImages = function (changed, original) {
    var changedData = capensis.extractImageData(changed),
        originalData = capensis.extractImageData(original);

    return capensis.decode.messageFromImageData(changedData, originalData);
}


capensis.decode.messageFromImageData = function(changed, original) {
    var changes = capensis.decode.getChangesInImageData(changed, original);
    return capensis.decode.bytesToString(changes);
}

// return changes between image data as array of bytes
capensis.decode.getChangesInImageData = function(changed, original) {
    var bytes = [],
        originalSlice,
        changedSlice,
        byte,
        MAX_MSG_LEN = 2000 * 3; // char len * 3 pixels per char

    var limit = Math.min(original.data.length - 12, MAX_MSG_LEN);

    // read three pixels of data at a time (12 elements)
    for (var idx = 0; idx < limit; idx += 12) {
        originalSlice = readSliceAt(original.data, idx);
        changedSlice = readSliceAt(changed.data, idx);

        if (_.isEqual(originalSlice, changedSlice)) {
            break;  // no difference in data slices, end of data
        }
        byte = sliceDifferenceToByte(originalSlice, changedSlice);
        bytes = bytes.concat(byte);
    }
    return bytes;

    // read 8 significant bits starting at boundaryIdx
    function readSliceAt(rgbData, boundaryIdx) {
        var bits = [],
            significantBits = capensis.significantBits;
        for (var sigBit = 0; sigBit < significantBits.length; sigBit += 1) {
            bits.push(rgbData[boundaryIdx + significantBits[sigBit]]);
        }
        return bits;
    }

    // [6,2,4,..], [7,2,3,..] => [1,0,1,..]
    function sliceDifferenceToByte(sliceA, sliceB) {
        var diff = [];
        for (var idx = 0; idx < sliceA.length; idx += 1) {
            diff.push(Math.abs(sliceA[idx] - sliceB[idx]));
        }
        return diff;
    }
}

// parse array of 8 bit bytes to string
capensis.decode.bytesToString = function (bytes) {
    var message = '';
    for (var idx = 0; idx < bytes.length; idx += 8) {
        message += byteToChar(bytes.slice(idx, idx + 8));
    }
    return message;

    // parse byte (8 bit array) into a character
    function byteToChar(byte) {
        var assert = capensis.assert;
        assert(byte.length === 8, 'byteToChar: expect 8 bit byte: ' +
                byte.length);
        var decimal = parseInt(byte.join(''), 2);
        return String.fromCharCode(decimal);
    }
}

capensis.assert = function (condition, message) {
    if (!condition) {
        throw new Error("ASSERTION FAIL: " + message);
    }
}

//----------------------------------------------------------------------------

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

// dev functions, will not remain

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
