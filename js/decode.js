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
