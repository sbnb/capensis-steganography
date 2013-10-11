capensis-steganography
======================

An implementation of image steganography: exchange secret messages encoded into images.

Imagine two users A and B. They wish to exchange messages via email but do not want their messages to be snooped on. Furthermore they are concerned that simply encrypting their messages will attract undue attention.

Instead of encryption they can exchange ordinary images as attachments, and encode their messages within the images.

Both users install this program locally on their computers. They then exchange a shared library of unique images. If this use is only for fun, the existing library images will suffice. If it is more serious, the shared library should be unique, and never exchanged through potentially unsafe methods.

Once they have a common shared library user A opens the encode page. She enters a message, then selects an image from the library. She saves the resulting encoded image to file, then sends it to user B via email.

User B gets the email, saves the image as ~/images/encded.png, and opens the program. After selecting Decode B then sees the encoded image on the left. By selecting the matching image on the right, from the shared library, the message is decoded and displayed.

How it works
============

The program converts the messages into binary arrays of eight bit bites, then inserts those as differences with the image. It uses the canvas to get hold of the images as arrays of color data.

The difference between an encoded and the source library image is very slight -- some of the rgb color values will be changed by 1 decimal value. This will not produce any perceptible difference to human eyes.

Automated detection (by a third party interceptor) is likely impossible provied the third party has no access to the original image. This would include finding the same image on the internet, using a reverse image search.

Hence the need for a safe and unique shared library, ideally exchange between A and B in person, not over the net.
