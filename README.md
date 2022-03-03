![CC0 license badge](https://licensebuttons.net/p/zero/1.0/88x31.png)

# blamscamp

> Mmh, options, runnin' out of options
> Mmh, options, used to have options

bandcamp is great (at time of writing,) but it would be great to have more options for selling zip files of MP3s on the internet. So I created this tool, which lets you create a bandcamp-style audio player for an individual album. The player is an entirely self-contained website, and can be hosted on a variety of platforms, but was designed specifically for itch.io.

[You can use it here](https://suricrasia.online/blamscamp/)

## serving

The following files are needed to host the blamscamp editor:

- index.html
- template.html
- jszip.min.js

To host the blamscamp player, all you need are the files provided in the exported zip.

**NOTE:** Your web server must support the Accept-Ranges header for track seeking to work.

## license

This software is public domain, aside from the libzip library.
