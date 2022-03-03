![CC0 license badge](https://licensebuttons.net/p/zero/1.0/88x31.png)

# blamscamp

> Mmh, options, runnin' out of options,
>
> Mmh, options, used to have options

bandcamp is great (at time of writing,) but it would be great to have more options for selling zip files of MP3s on the internet. So I created this tool, which lets you create a bandcamp-style audio player for an individual album. The player is an entirely self-contained website, and can be hosted on a variety of platforms, but was designed specifically for itch.io.

[You can use it here](https://suricrasia.online/blamscamp/)

## roadmap

[ ] reimport exported zip files for editing
[ ] bulk import music or zip file of music/cover art
[ ] auto parsing of music order/title from ID3 tags
[ ] custom css field
[ ] option to add additional files to the generated zip file (e.g. so one can set a background image through custom css)
[ ] option to re-encode audio to lower bitrate
[ ] auto-updating of the generated player
[ ] improve mobile support on itch.io. ostensibly only unity games are allowed to have dynamic sizing.

## serving

The following files are needed to host the blamscamp editor:

- index.html
- template.html
- jszip.min.js

To host the blamscamp player, all you need are the files provided in the exported zip.

**NOTE:** Your web server must support the Accept-Ranges header for track seeking to work.

## contributing

Pull requests are welcome! But please note the following:

The generated blamscamp player must not receive any added dependencies. The generator must stay as a single, self-contained file that is as small as reasonably possible. The point is for the generated file to be lightweight. Stick to Vanilla JS.

The blamscamp editor, i.e. index.html, also uses Vanilla JS. I see this as a feature and not a bug. I would like to stick to vanilla as long as possible. That said, if things get too cumbersome I would be amenable to using a framework as long as it's lightweight. Right now blamscamp loads almost instantaniously and I would like to keep it that way.

Additionally, I have set a dependency budget of "4" for this project. The target dependencies are:

[X] JSZip (added)
[ ] an ID3 Tag Parser
[ ] a MP3 audio encoder
[ ] (unfilled)

Dependencies of dependencies count toward the total.

Things we would like:

- UI polish in either the editor or player
- refactoring to make the code simpler
  - if a new browser feature that has a caniuse score of >95% can remove like 10 lines of code, go for it!
- implementations of roadmap features

## license

This software is public domain, aside from the libzip library.
