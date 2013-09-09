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
            encoded: 'images/encoded.png'
        },
        buffer = document.createElement('canvas'),
        significantBits = [0, 1, 2, 4, 5, 6, 8, 9];

    buffer.width = WIDTH;
    buffer.height = HEIGHT;

    var bufferCtx = buffer.getContext('2d');

    function init() {
        loadImages(imagePaths, addEventHandlers);
    }

    // TODO: image alpha values must always be opaque (255)
    // check and notify user if image unsuitable
    function addEventHandlers(images) {
        $('.imageDecode').off().on('click', function (e) {
            var originalImgObj = getImageObjFromHtmlImageSrc(images, e.target.src),
                changedImgObj = images.encoded;

            var changedImageData = getImageDataViaCanvas(changedImgObj, buffer),
                originalImageData = getImageDataViaCanvas(originalImgObj, buffer),
                changes = getChangesBetweenImageData(changedImageData, originalImageData),
                message = extractMessageFromImage(buffer, changedImgObj, originalImgObj);

            $('#messagePlaceHolder').text(message);
        });

        $('.imageEncode').off().on('click', function (e) {
            var image = getImageObjFromHtmlImageSrc(images, e.target.src);
            encodeMessageIntoImage($('#message').val(), image);
        });
    }

    function getImageObjFromHtmlImageSrc(images, src) {
        var path = 'images/' + src.split('/').pop(),
            key = Object.getKeyByValue(imagePaths, path);
        return images[key];
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

    // find message in changed image, in the differences from original
    function extractMessageFromImage(canvas, changed, original) {
        var changedImageData = getImageDataViaCanvas(changed, canvas),
            originalImageData = getImageDataViaCanvas(original, canvas);
        return extractMessageFromImageData(changedImageData, originalImageData);
    }

    function encodeMessageIntoImage(message, image) {
        var imageData = getImageDataViaCanvas(image, buffer);
        encodeMessageInImageData(message, imageData);

        console.log('encodeMessageIntoImage(): first 20 elmts: ',
                getFirstNElementsOfClampedArray(imageData.data, 20));


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

    // store the message as a difference to image data
    function encodeMessageInImageData(message, imageData) {
        var bytes = stringToBytes(message),
            byteIdx = 0,
            rgbIdx = 0;

        for (byteIdx = 0; byteIdx < bytes.length; byteIdx += 8) {
            storeByte(imageData, rgbIdx, bytes.slice(byteIdx, byteIdx + 8));
            rgbIdx += 12;
        }
    }

    // TODO: organise code by grouping related functions into nested funcs
    // or better: module pattern to more levels

    // one 8 bit byte is stored in 3 pixels, which is 12 elements of data
    // c = changed, x = unchanged, a = alpha (a also unchanged)
    // c,c,c,a,c,c,c,a,c,c,x,a
    function storeByte(imageData, threePxBoundary, byte) {
        for (var idx = 0; idx < significantBits.length; idx += 1) {
            storeBit(imageData, threePxBoundary + significantBits[idx], byte[idx]);
        }

        // store bit as difference, add or subtract to keep within 0..255
        function storeBit(imageData, imageDataIdx, bit) {
            var negate = imageData.data[imageDataIdx] > 254 ? -1 : 1;
            imageData.data[imageDataIdx] += bit * negate;
        }
    }



    function extractMessageFromImageData(changed, original) {
        var changes = getChangesBetweenImageData(changed, original);
        return bytesToString(changes);
    }

    // return changes between image data as array of bytes
    function getChangesBetweenImageData(changed, original) {
        var bytes = [],
            originalSlice,
            changedSlice,
            byte;

        // read three pixels of data at a time (12 elements)
        for (var idx = 0; idx < original.data.length - 12; idx += 12) {
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
            var bits = [];
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
    function bytesToString(bytes) {
        var message = '';
        for (var idx = 0; idx < bytes.length; idx += 8) {
            message += byteToChar(bytes.slice(idx, idx + 8));
        }
        return message;

        // parse byte (8 bit array) into a character
        function byteToChar(byte) {
            assert(byte.length === 8, 'byteToChar: expect 8 bit byte: ' +
                    byte.length);
            var decimal = parseInt(byte.join(''), 2);
            return String.fromCharCode(decimal);
        }
    }


    // turn string into array of 8 bit bytes
    function stringToBytes(message) {
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
            assert(0 <= num && num <= 255, 'decimalToByte: bad num ' + num);

            var binaryString = '00000000' + num.toString(2),
                byte = binaryString.slice(-8).split('');

            for (var idx = 0; idx < byte.length; idx += 1) {
                byte[idx] = parseInt(byte[idx], 10);
            }
            return byte;
        }
    }

    // utility function, Chrome does not provide slice on Uint8ClampedArray
    function getFirstNElementsOfClampedArray(clamped, n) {
        var limit = n <= clamped.length ? n : clamped.length,
            elements = [];
        for (var idx = 0; idx < limit; idx += 1) {
            elements.push(clamped[idx]);
        }
        return elements;
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
        stringToBytes: stringToBytes,
        storeByte: storeByte
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
