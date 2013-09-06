describe('Email Steganography Tests', function() {

    var fakeImageData,
        clonedImageData,
        message;

    beforeEach(function() {
        myNameSpace.init();
        fakeImageData = {
            width: 100,
            height: 100,
            data: []
        };
        var len = fakeImageData.width * fakeImageData.height * 4;
        for (var idx = 0; idx < len; idx += 1) {
            fakeImageData.data[idx] = 150;
        }
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
    });

    describe('Inserting messages', function() {

        it('alters the image data when inserting a message', function() {
            myNameSpace.encodeMessageInImageData(message, fakeImageData);
            // fakeImageData and clonedImageData should now be different
            expect(fakeImageData.data).not.toEqual(clonedImageData.data);
        });

        it('can convert a message to an 8 bit binary representation', function() {
            var simple = 'hey',
                binary8Bit = myNameSpace.messageToEightBitBinary(simple);
            expect(binary8Bit.length).toBe(3);
            expect(binary8Bit[0].length).toBe(8);
            expect(binary8Bit[0]).toEqual([0,1,1,0,1,0,0,0]);
            expect(binary8Bit[1]).toEqual([0,1,1,0,0,1,0,1]);
            expect(binary8Bit[2]).toEqual([0,1,1,1,1,0,0,1]);
        });

    });

    describe('Extracting messages', function() {

        it('can extract changes in image data after alteration', function() {
            for (var idx = 0; idx < 16; idx += 1) {
                fakeImageData.data[idx] += 1;
            }
            var changes = myNameSpace.getChangesBetweenImageData(fakeImageData,
                    clonedImageData);
            expect(changes.length).toBe(16);
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
