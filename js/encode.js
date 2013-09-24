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
