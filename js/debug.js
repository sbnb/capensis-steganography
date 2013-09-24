// helpful debugging methods - run capensis.debug.runDebug from addEventHandlers
// for one time debug run
capensis.debug = capensis.debug || {};

capensis.debug.runDebug = function (images) {

    var imgData = capensis.extractImageData(images.image01);
    console.log('', getFirstNElementsOfClampedArray(imgData.data, 32).join(' '));

    function compareImages(imgA, imgB, nameA, nameB) {
        var imgAData = capensis.extractImageData(imgA);
        var imgBData = capensis.extractImageData(imgB);
        isImageDataSame(imgAData, imgBData);
        console.log(nameA, getFirstNElementsOfClampedArray(imgAData.data, 32).join(' '));
        console.log(nameB, getFirstNElementsOfClampedArray(imgBData.data, 32).join(' '));
    }

    function insertMessage(name, imgA, msg) {
        console.log('encode', msg, 'into', name);
        capensis.encode.messageIntoImage(msg, imgA);
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

    function isImageDataSame(imageDataA, imageDataB) {
        // check dimensions match
        if (imageDataA.width !== imageDataB.width ||
            imageDataA.height !== imageDataB.height) {
                console.log('Dimensions do not match for images.');
                return false;
        }

        // check pixels match
        for (var idx = 0; idx < imageDataA.data.length; idx += 1) {
            if (imageDataA.data[idx] !== imageDataB.data[idx]) {
                console.log('the data does not match at idx: ' + idx);
                return false;
            }
        }
        console.log('images match!');
        return true;
    }
};

capensis.debug.encryptionDemo = function (sjcl) {
    var message = 'This is the secret message',
        password = 'RedRockApple',
        encryptedMessage = sjcl.encrypt(password, message),
        decryptedMessage = sjcl.decrypt(password, encryptedMessage),
        serializedEncrypted = JSON.stringify(encryptedMessage),
        deserializedEncrypted = JSON.parse(serializedEncrypted),
        finalMessage = sjcl.decrypt(password, deserializedEncrypted);
        console.log('message: ' + message);
        console.log('encrypted: ' + encryptedMessage);
        console.log('decrypted: ' + decryptedMessage);
        console.log('serializedEncrypted: ' + serializedEncrypted);
        console.log('deserializedEncrypted: ' + deserializedEncrypted);
};
