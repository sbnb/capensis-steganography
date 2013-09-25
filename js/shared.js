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

    ctx.drawImage(image, 0, 0);
    return ctx.getImageData(0, 0, width, height);
}

capensis.assert = function (condition, message) {
    if (!condition) {
        throw new Error("ASSERTION FAIL: " + message);
    }
}

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
