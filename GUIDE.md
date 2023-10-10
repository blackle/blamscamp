# blamscamp guide

[Youtube tutorial here](https://www.youtube.com/watch?v=fE6G0zSec1E)

## basic usage

To use blamscamp, fill in your album title and artist name. You can also upload a cover image. Click the "add song" button to add songs to your album. You can set the title for each individual song and choose its audio file from the file browser.

Most of these fields are optional, so you can have an album with no cover and no artist if you want, or no title. Your choice.

You can set the background colour, foreground colour (font colour,) and highlight colour (colour for album name/artist name/song titles).

You can add additional files to include in the resulting zip file. If you add images, you can use them in the "custom css," otherwise they're just loose in the zip file. Try not to have multiple files with the same file name.

Click "generate" to see a live preview in the second pane.

Click "export zip" to get a zip file that contains your player, music files, and cover image. This is what you upload to itch.io.

## adding to itch.io

On the itch.io main page, click the dropdown next to your icon and hit "upload a new project."

You must have the following fields set:

 - "Classification" should be "Soundtrack"
 - "Kind of project" should be "HTML"

Now, uploaded your exported ZIP file. Select the option "this file will be played in the browser."

Next, tweak the viewport dimensions. This decides how big the widget is going to be. I found the maximum width is 960px. The height will depend on how many songs you have in your album. The more songs you have the taller the widget will have to be.

Make sure the following other checkboxes are checked:

 - "Automatically start on page load"
   - this avoids the "run soundtrack" button when you open the page
 - "Enable scrollbars"
   - This will allow users to scroll down inside the applet if your height isn't tall enough. Otherwise, things will be cutoff.

After doing all this, the blamscamp player should appear when you open up your project's store page.

If you want your music to also be purchasable, upload a second ZIP that just contains the music files. If you set your project to purchasable, this is the zip that a buyer will download. You can put higher quality audio files in that zip or other goodies if you want.

## troubleshooting

### audio doesn't play

This can be caused by using an unsupported audio format. Please try MP3 files. They are very widely supported.

### doesn't work on mobile

This is true, I would like to improve this in the future.

### editor suddenly broke/needs to refresh

This may be a bug. If you're inclined to make a bug report, please open the debugger console and copy the error message to a bug report, or send in an email to blackle@suricrasia.online
