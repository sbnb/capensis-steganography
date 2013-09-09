describe('Email Steganography Tests', function() {

    var fakeImageData,
        clonedImageData,
        message;

    beforeEach(function() {
        myNameSpace.init();
        fakeImageData = createImageData(100, 100, 150);
        clonedImageData = JSON.parse(JSON.stringify(fakeImageData));
        message = 'this is the secret message';
    });

    describe('Check mock data is correctly setup', function() {

        it('clonedImageData is perfect copy of fakeImageData', function() {
            expect(fakeImageData.data).toEqual(clonedImageData.data);
        });

        it('there are no changes when comparing identical image data', function() {
            var changes = myNameSpace.getChangesBetweenImageData(fakeImageData,
                    clonedImageData);
            expect(changes.length).toBe(0);
        });

        it('image data is completely opaque', function() {
            var alphaValues = getAlphaChannel(fakeImageData.data);
            expect(alphaValues).toHaveAllValuesInRange(255, 255);
        });

    });

    describe('Inserting messages', function() {

        it('alters the image data when inserting a message', function() {
            myNameSpace.encodeMessageInImageData(message, fakeImageData);
            expect(fakeImageData.data).not.toEqual(clonedImageData.data);
        });

        it('alters the image data when inserting minimal message "a"', function() {
            var imageData = createImageData(2, 1, 254);
            myNameSpace.encodeMessageInImageData('a', imageData);
            expect(imageData.data).not.toEqual(clonedImageData.data);
        });

        it('can convert a message to an array of 8 bit bytes', function() {
            var simple = 'hey',
                bytes = myNameSpace.stringToBytes(simple);
            expect(bytes.length).toBe(24);
            expect(bytes).toEqual([
                0,1,1,0,1,0,0,0,
                0,1,1,0,0,1,0,1,
                0,1,1,1,1,0,0,1]);
        });

        it('does not change the alpha channel on insertion', function() {
            myNameSpace.encodeMessageInImageData(message, fakeImageData);
            var alphaChannel = getAlphaChannel(fakeImageData.data);
            expect(alphaChannel).toHaveAllValuesInRange(255, 255);
        });


        it('handles rgba values of 0 edge case', function() {
            var imageData = createImageData(3, 1, 0);
            myNameSpace.encodeMessageInImageData('a', imageData);
            expect(imageData.data).toEqual([
                0, 1, 1, 255,
                0, 0, 0, 255,
                0, 1, 0, 255]);
        });

        it('handles rgba values of 254 edge case', function() {
            var imageData = createImageData(3, 1, 254);
            myNameSpace.encodeMessageInImageData('a', imageData);
            expect(imageData.data).toEqual([
                254, 255, 255, 255,
                254, 254, 254, 255,
                254, 255, 254, 255]);
        });

        it('handles rgba values of 255 edge case', function() {
            var imageData = createImageData(3, 1, 255);
            myNameSpace.encodeMessageInImageData('a', imageData);
            expect(imageData.data).toEqual([
                255, 254, 254, 255,
                255, 255, 255, 255,
                255, 254, 255, 255]);
        });

    });

    describe('Extracting messages', function() {

        it('can extract changes in image data after alteration', function() {
            myNameSpace.storeByte(fakeImageData, 0, [1,1,1,1,1,1,1,1]);
            myNameSpace.storeByte(fakeImageData, 12, [1,1,1,1,1,1,1,1]);

            var changes = myNameSpace.getChangesBetweenImageData(fakeImageData,
                    clonedImageData);
            expect(changes.length).toBe(16);
            expect(changes).toHaveAllValuesInRange(1, 1);
        });

        it('can retrieve expected binary array after inserting message', function() {
            var simple = 'hey';
            myNameSpace.encodeMessageInImageData(simple, fakeImageData);
            var changes = myNameSpace.getChangesBetweenImageData(fakeImageData,
                    clonedImageData);

            expect(changes.length).toBe(24);
            expect(changes.slice(0, 8)).toEqual([0,1,1,0,1,0,0,0]);
            expect(changes.slice(8, 16)).toEqual([0,1,1,0,0,1,0,1]);
            expect(changes.slice(16, 24)).toEqual([0,1,1,1,1,0,0,1]);
        });

        it('can retrieve a plain message', function() {
            myNameSpace.encodeMessageInImageData(message, fakeImageData);
            var changes = myNameSpace.getChangesBetweenImageData(fakeImageData,
                    clonedImageData);
            var text = myNameSpace.extractMessageFromImageData(fakeImageData,
                    clonedImageData);
            expect(text).toEqual(message);
        });

    });


});
