beforeEach(function() {
  this.addMatchers({
    toBeLessThan: function(expected) {
      return this.actual < expected;
    },
    toHaveAllValuesInRange: function (low, high) {
        for (var idx = 0; idx < this.actual.length; idx += 1) {
            if (this.actual[idx] < low || this.actual[idx] > high) {
                return false;
            }
        }
        return true;
    }
  });
});

function setIfUndefined(variable, defaultValue) {
    variable = (typeof variable === "undefined") ? defaultValue : variable;
    return variable;
}

// mock up an imageData object
function createImageData(width, height, colorDecimal, alphaValue) {
    alphaValue = setIfUndefined(alphaValue, 255);
    var fakeImageData = {
        width: width,
        height: height,
        data: []
    };
    var len = fakeImageData.width * fakeImageData.height * 4;
    for (var idx = 0; idx < len; idx += 1) {
        fakeImageData.data[idx] = colorDecimal;
        if ((idx + 1) % 4 === 0) {
            fakeImageData.data[idx] = alphaValue;
        }
    }
    return fakeImageData;
}

function getAlphaChannel(rgbaData) {
    var alphaValues = [];
    for (var idx = 3; idx < rgbaData.length; idx += 4) {
        alphaValues.push(rgbaData[idx]);
    }
    return alphaValues;
}
