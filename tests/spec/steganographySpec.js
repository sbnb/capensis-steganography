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

        it('inserting message sets magic bits indicating image data altered', function() {
            myNameSpace.encodeMessageInImageData(message, fakeImageData);
            var changes = myNameSpace.getChangesBetweenImageData(fakeImageData,
                    clonedImageData);
            expect(changes[0]).toBe(1);
            expect(changes[1]).toBe(1);
            expect(changes[2]).toBe(1);
            expect(changes[3]).toBe(1);
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

        it('can insert and retrieve a simple string into/from image data', function() {
            var simple = 'hey';
            myNameSpace.encodeMessageInImageData(simple, fakeImageData);
            var changes = myNameSpace.getChangesBetweenImageData(fakeImageData,
                    clonedImageData);

            expect(changes.length).toBe(24 + 4);
            console.log(changes);
            expect(changes.slice(0, 4)).toEqual([1,1,1,1]);
            expect(changes.slice(4, 12)).toEqual([0,1,1,0,1,0,0,0]);
            expect(changes.slice(12, 20)).toEqual([0,1,1,0,0,1,0,1]);
            expect(changes.slice(20, 28)).toEqual([0,1,1,1,1,0,0,1]);
        });
    });


});
