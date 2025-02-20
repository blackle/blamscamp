
const VERSION = "0.0.3";

const $ = selector => document.querySelector(selector),
      $$ = selector => document.querySelectorAll(selector);

$("#version").textContent = "v" + VERSION;
/**
 * Adds an event listener that triggers only if it was called on a specific child element, or its grandchildren.
 * Suitable child elements are tested against a CSS selector.
 *
 * @param {HTMLElement} root The root element that listens for events on its child elements.
 * @param {HTMLElement} selector The selector to filter child elements.
 * @param {string} event The name of an Event, like "click" or "change".
 * @param {Function} callback The callback to call when an event occurs.
 * `this` will point to the child element that triggered this callback.
 *
 * @returns {void}
 */
const delegate = (root, selector, event, callback) => {
  root.addEventListener(event, e => {
    const closest = e.target.closest(selector);
    if (!closest) return;
    callback.apply(closest, [e]);
  });
};

for (const field of $$("[data-stored-key]")) {
  field.onchange = () => {
    make_preview();
  }
}

let common_datastore = {};
const isCheckable = tag => tag.type === 'checkbox' || tag.type === 'radio';
const gather_fields = () => {
  common_datastore = {};
  for (const field of $$("[data-stored-key]")) {
    const scope = field.getAttribute('data-stored-scope'),
          key = field.getAttribute('data-stored-key'),
          value = isCheckable(field) ? field.checked : field.value;
    if (scope) {
      if (!(scope in common_datastore)) {
        common_datastore[scope] = {};
      }
      common_datastore[scope][key] = value;
    } else {
      common_datastore[key] = value;
    }
  }
};

const update_fields = (data) => {
  for (const field of $$("[data-stored-key]")) {
    const scope = field.getAttribute('data-stored-scope'),
          key = field.getAttribute('data-stored-key');
    let value = undefined;
    try { value = scope ? data[scope][key] : data[key] } catch {}

    if (isCheckable(field)) {
      if (typeof value != "undefined") {
        field.checked = value || false;
      } else {
        field.checked = field.dataset.default || false;
      }
    } else {
      field.value = value || field.dataset.default || '';
    }
    if (field.oninput) field.oninput(field.value)
  }
};
update_fields({}); //fill with defaults

const ifHTMLMatcher = (varName) => new RegExp(`<:if:${varName}:>([\\s\\S]*?)(?:<:else:${varName}:>([\\s\\S]*?))?<:endif:${varName}:>`, "g");
const brokenIfHTMLMatcher = /<:if:(\S+):>[\s\S]*?(?:<:else:\1:>([\s\S]*?))?<:endif:\1:>/g
const varHTMLMatcher = (varName) => new RegExp(`<:${varName}:>`, "g");
function applyVarsToTemplate(input, vars) {
  let output = input;
  for (const i in vars) {
    output = output.replace(varHTMLMatcher(i), () => (typeof vars[i] === 'object' ? JSON.stringify(vars[i]) : vars[i]));
    output = output.replace(ifHTMLMatcher(i), (Array.isArray(vars[i]) ? vars[i].length : vars[i]) ? "$1" : "$2");
  }
  output = output.replace(brokenIfHTMLMatcher, "$2");
  output = output.replace(varHTMLMatcher("\\S+"), "");
  return output;
};

const form = $("#editor");
const export_button = $("#export");
const import_button = $("#import");
const zip_input = $("#zip_input");
const export_spinner = $("#export_spinner");
const import_spinner = $("#import_spinner");

const color_pickers = $$('.color_picker');
const iro_obj = new iro.ColorPicker('#iro', {
  width: 150, layoutDirection: "horizontal"
});
$('#iro').addEventListener('mousedown', (ev) => {
  ev.preventDefault();
});

for (let color_picker of color_pickers) {
  color_picker.oninput = e => {
    const value = color_picker.value;
    color_picker.style.backgroundImage = "linear-gradient("+value+", "+value+")";
  }
  function on_color_change(color) {
    const hex = color.hexString || color;
    color_picker.value = hex;
    color_picker.oninput();
    //silly way of getting the little swatch next to the input element
    // color_picker.style.backgroundImage = "linear-gradient("+hex+", "+hex+")";
    //todo: auto-update CSS
  }
  color_picker.onfocus = e => {
    iro_obj.el.classList.remove("disabled");
    try { iro_obj.color.hexString = color_picker.value }
    catch { on_color_change("#000000"); }
    iro_obj.on("color:change", on_color_change);
  };
  color_picker.onblur = e => {
    iro_obj.el.classList.add("disabled");
    iro_obj.off("color:change", on_color_change);
    make_preview();
  };
  on_color_change(color_picker.value);
}

/**
 * - title (string) — The title of the song, as it is displayed in the playlist
 * - filename (string) — The name of the imported file, with its extension
 * - file (Blob) — The audio file itself
 * - url (string) — A cached link to the file's blob, playable in the preview box
 * - time (string) — The length of the track in format X:XX
 */
const songs_datastore = [];
const song_template = `
  <div class="song well" data-song-idx="<:idx:>">
    <button type="button" class="song_remove">remove song</button>
    <input class="song_title" type="text" value="<:title:>" placeholder="song title"/>
    <span class="song_duration"><:time:></span>
    <button type="button" class="song_set">replace file</button>
    <button type="button" class="song_up <:if:first:>invisible<:endif:first:>">⬆</button>
    <button type="button" class="song_down <:if:last:>invisible<:endif:last:>">⬇</button>
  </div>
`;
const songs_list = $(".songs_list");
function songs_rerender() {
  songs_list.innerHTML = songs_datastore
    .map((song, idx) => applyVarsToTemplate(song_template, {
      ...song,
      idx,
      first: idx === 0,
      last: idx === songs_datastore.length - 1
  })).join("");
};
async function get_audio_duration(url) {
  const tmp_audio = new Audio();
  await new Promise(resolve => {
    tmp_audio.addEventListener("loadedmetadata", resolve, {once:true});
    tmp_audio.src = url;
  });
  const duration = Math.ceil(tmp_audio.duration);
  return Math.floor(duration / 60) + ":" + String(duration % 60).padStart(2, "0");
}

function get_file_tags(file) {
  return new Promise((resolve, reject) => {
    jsmediatags.read(file, {
      onSuccess: (data) => {
        resolve(data);
      },

      onError: (error) => {
        reject(error);
      }
    });
  })
}
/**
 * @param {Blob} file — the audio file to import
 */
async function add_song(file) {
  const song = {
    file,
    url: URL.createObjectURL(file)
  };
  if (file instanceof File) {
    song.filename = file.name;
    song.title = file.name
      .replace(/\.\S+$/, "")
      .replace(/(\p{Lowercase_Letter})(\p{Uppercase_Letter})/gu, "$1 $2");
  }

  song.time = await get_audio_duration(song.url);
  song.track = songs_datastore.length + 1;
  try {
    const { tags } = await get_file_tags(file)
    if (tags?.title ?? false) {
      song.title = tags.title;
    }
    if (tags?.track ?? false) {
      song.track = tags.track;
    }
  } catch (err) {
    console.error('failed to read tags from: ' + file.name, err);
  }

  songs_datastore.push(song);
  return song;
};
const add_song_button = $("#add_song_button");
const add_songs_input = $("#add_songs_input"),
      change_song_input = $("#change_song_input");
add_song_button.onclick = () => {
  add_songs_input.click();
};
add_songs_input.onchange = async e => {
  const promises = [...e.target.files].map(add_song);
  await Promise.all(promises);

  // resort songs after batch adding
  function track_key(a) {
    if (isNaN(a.track)) {
      return -1;
    } else {
      return parseInt(a.track, 10);
    }
  }
  songs_datastore.sort((a, b) => {
    return track_key(a) - track_key(b);
  });

  songs_rerender();
  e.target.value = "";
  make_preview();
};
songs_rerender();

// Event delegation for the sound list
delegate(songs_list, '.song_remove', 'click', function (e) {
  const idx = Number(this.closest('.song').getAttribute('data-song-idx'));
  songs_datastore.splice(idx, 1);
  songs_rerender();
  make_preview();
});
let current_sound;
delegate(songs_list, '.song_set', 'click',function () {
  const idx = Number(this.closest('.song').getAttribute('data-song-idx'));
  current_sound = songs_datastore[idx];
  change_song_input.click();
});
change_song_input.onchange = async () => {
  const file = change_song_input.files[0];
  current_sound.file = file;
  current_sound.url = URL.createObjectURL(file);
  current_sound.time = await get_audio_duration(current_sound.url);
  current_sound = void 0;
  change_song_input.value = '';
  songs_rerender();
  make_preview();
};
delegate(songs_list, '.song_title', 'change', function() {
  const idx = Number(this.closest('.song').getAttribute('data-song-idx'));
  songs_datastore[idx].title = this.value.trim();
});
delegate(songs_list, '.song_up', 'click',function () {
  const idx = Number(this.closest('.song').getAttribute('data-song-idx'));
  songs_datastore[idx].track = Math.min(1, idx);
  songs_datastore[idx - 1].track = Math.max(songs_datastore.length, idx + 1);
  [songs_datastore[idx], songs_datastore[idx - 1]] = [songs_datastore[idx - 1], songs_datastore[idx]];
  songs_rerender();
  make_preview();
});
delegate(songs_list, '.song_down', 'click',function () {
  const idx = Number(this.closest('.song').getAttribute('data-song-idx'));
  songs_datastore[idx].track = Math.max(songs_datastore.length, idx + 1);
  songs_datastore[idx + 1].track = Math.min(1, idx);
  [songs_datastore[idx], songs_datastore[idx + 1]] = [songs_datastore[idx + 1], songs_datastore[idx]];
  songs_rerender();
  make_preview();
});


const cover_datastore = {};
const cover_template = `
  <:if:file:>
    <button type="button" class="cover_art_set">replace cover</button>
    <button type="button" class="cover_art_remove">remove cover</button>
  <:else:file:>
    <button type="button" class="cover_art_set">add cover art</button>
  <:endif:file:>
`;
const cover_art_block = $(".cover_art");
function cover_art_rerender() {
  cover_art_block.innerHTML = applyVarsToTemplate(cover_template, cover_datastore);
};
const cover_input = $("#cover_input");
cover_input.onchange = e => {
  cover_datastore.file = e.target.files[0];
  // Rename to, for example, cover.jpg
  cover_datastore.filename = e.target.files[0].name.replace(/[\s\S]+(\.\S+)$/, 'cover$1');
  cover_datastore.url = URL.createObjectURL(e.target.files[0]);
  e.target.value = "";
  cover_art_rerender();
  make_preview();
};
delegate(cover_art_block, ".cover_art_set", "click", () => {
  cover_input.click();
});
delegate(cover_art_block, ".cover_art_remove", "click", () => {
  delete cover_datastore.file;
  delete cover_datastore.filename;
  delete cover_datastore.url;
  cover_art_rerender();
  make_preview();
});
cover_art_rerender();


/**
 * - filename (string) — The name of the imported file, with its extension
 * - type (string) — The mimetype of the imported file
 * - is_image (bool) — Whether the file is an image or not
 * - file (Blob) — The file itself
 * - url (string) — A cached link to the file's blob, usable in the preview box
 */
const extras_datastore = [];
const extra_template = `
  <div class="extra well" data-extra-idx="<:idx:>">
    <button type="button" class="extra_remove">remove file</button>
    <input class="extra_filename" type="text" value="<:filename:>" placeholder="extra file name"/>
    <span class="extra_type"><:type:></span>
    <:if:is_image:>
    <img src="<:url:>" class="image_preview" />
    <:endif:is_image:>
  </div>
`;
const extras_list = $(".extras_list");
function extras_rerender() {
  extras_list.innerHTML = extras_datastore
    .map((extra, idx) => applyVarsToTemplate(extra_template, {
      ...extra,
      idx,
    })).join("");
};

/**
 * @param {Blob} file — the arbitrary file to import
 */
async function add_extra(file) {
  const extra = {
    file,
    url: URL.createObjectURL(file)
  };
  if (file instanceof File) {
    const { name, type } = file;
    extra.filename = name;
    extra.is_image = type.includes('image/');
    extra.type = type ? type : name.substring(name.lastIndexOf('.') + 1);
  }

  extras_datastore.push(extra);

  sort_extras();

  return extra;
};
function sort_extras() {
  extras_datastore.sort((a, b) => {
    if (a.type === b.type) {
      const a_filename = a.filename.toLowerCase();
      const b_filename = b.filename.toLowerCase();
      if (a_filename === b_filename) return 0;
      return a_filename < b_filename ? -1 : 1;
    }
    return a.type < b.type ? -1 : 1;
  });
}

const add_extra_button = $("#add_extra_button");
const add_extras_input = $("#add_extras_input");
add_extra_button.onclick = () => {
  add_extras_input.click();
};
add_extras_input.onchange = async e => {
  const promises = [...e.target.files].map(add_extra);
  await Promise.all(promises);
  extras_rerender();
  e.target.value = "";
  make_preview();
};
extras_rerender();

// Event delegation for the sound list
delegate(extras_list, '.extra_remove', 'click', function (e) {
  const idx = Number(this.closest('.extra').getAttribute('data-extra-idx'));
  extras_datastore.splice(idx, 1);
  extras_rerender();
});
delegate(extras_list, '.extra_filename', 'change', function() {
  const idx = Number(this.closest('.extra').getAttribute('data-extra-idx'));
  extras_datastore[idx].filename = this.value.trim();
  sort_extras();
  extras_rerender();
});


async function serialize(final) {
  gather_fields();
  let data = {
    ...common_datastore
  };
  data.blamscamp_version = VERSION;
  if (cover_datastore.file) {
    data.cover = final ? cover_datastore.filename : cover_datastore.url;
  }
  data.songs = songs_datastore.map((song, idx) => ({
    idx: idx + 1,
    filename: final ? song.filename : song.url,
    title: song.title,
    time: song.time
  }));
  if (extras_datastore.length > 0) {
    data.extras = extras_datastore.map((extra, idx) => ({
      idx: idx + 1,
      filename: extra.filename,
      type: extra.type,
    }));
  }
  return data;
}
async function deserialize(file) {
  const archive = await JSZip.loadAsync(file);
  if (!('blamscamp.json' in archive.files)) {
    alert('Cannot find blamscamp.json in the zip archive. Make sure you select a file you exported with blamscamp.');
    return;
  }
  const data = JSON.parse(await archive.files['blamscamp.json'].async('text'));
  update_fields(data);
  const promises = [];
  // Deserialize songs.
  songs_datastore.length = 0;
  for (const song of data.songs) {
    promises.push(
      archive.files[song.filename].async('blob')
      .then(blob => add_song(blob))
      .then(songStored => {
        songStored.filename = song.filename;
        songStored.title = song.title;
      })
    );
  }
  // Do the same for the cover image. Store needed data in the input tag.
  if (data.cover) {
    cover_datastore.file = await archive.files[data.cover].async('blob');
    cover_datastore.filename = data.cover;
    cover_datastore.url = URL.createObjectURL(cover_datastore.file);
  } else {
    delete cover_datastore.file;
    delete cover_datastore.filename;
    delete cover_datastore.url;
  }
  // Deserialize extra files.
  extras_datastore.length = 0;
  if (data.extras) {
    for (const extra of data.extras) {
      promises.push(
        archive.files[extra.filename].async('blob')
        .then(blob => add_extra(blob))
        .then(extraStored => {
          extraStored.filename = extra.filename;
          extraStored.type = extra.type;
          extraStored.is_image = extra.type.includes('image/');
        })
      );
    }
  }
  await Promise.all(promises);
  cover_art_rerender();
  songs_rerender();
  extras_rerender();
  make_preview();
};

let template, template_song, template_body;
fetch('template.html', {method: 'GET'})
.then(response => response.text())
.then(text => {
  template = text;
  template_song = template.match(/<:song_start:>([\s\S]*)<:song_end:>/)[1];
  template_body = template.replace(/<:song_start:>(?:[\s\S]*)<:song_end:>/, "<:songs:>");
})
.catch(error => console.error('error:', error));
function generate(data, final) {
  let out = template_body;
  let songs = data.songs.map((song, idx) => applyVarsToTemplate(template_song, {
    index: idx + 1,
    ...song
  }));
  const templateVars = {
    blamscamp_version: data.blamscamp_version,
    album: data.album,
    artist: data.artist,
    description: md(data.description),
    cover: data.cover,
    songs: songs.join("\n"),
    ...data.settings
  };
  if (!final) {
    templateVars.theme_transparent = false;
    if (templateVars.remember_position) {
      templateVars.force_show_remember_position = true;
    }
  } else {
    // Generate a UUID for exports so localStorage can have a unique key
    // UUID generator from https://stackoverflow.com/a/2117523
    templateVars.uuid = "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }
  out = applyVarsToTemplate(out, templateVars);
  return out;
}
export_button.onclick = async (e) => {
  export_button.disabled = true;
  export_spinner.classList.remove("hidden");
  const data = await serialize(true);
  let zip = new JSZip();
  zip.file('blamscamp.json', JSON.stringify(data));
  zip.file('index.html', generate(data, true));
  for (const song of songs_datastore) {
    zip.file(song.filename, song.file);
  }
  if (cover_datastore.file) {
    zip.file(cover_datastore.filename, cover_datastore.file);
  }
  for (const extra of extras_datastore) {
    zip.file(extra.filename, extra.file);
  }
  const zip_blob = await zip.generateAsync({type:"blob"})
  const a = document.createElement('a');
  a.download = data.album + "_blamscamp.zip";
  a.href = URL.createObjectURL(zip_blob);
  a.click();
  URL.revokeObjectURL(a.href);
  export_button.disabled = false;
  export_spinner.classList.add("hidden");
};
const make_preview = async () => {
  const data = await serialize(false);
  if (data.settings.theme_css) {
    for (const extra of extras_datastore) {
      data.settings.theme_css = data.settings.theme_css.replace(new RegExp(extra.filename, 'g'), extra.url);
    }
  }
  $("iframe").srcdoc = generate(data, false);
};
$("#generate").onclick = () => {
  make_preview();
};
form.addEventListener("submit", e => {
  e.preventDefault();
  make_preview();
});
import_button.onclick = () => {
  zip_input.click();
};
zip_input.onchange = async e => {
  import_spinner.classList.remove("hidden");
  import_button.disabled = true;
  const file = e.target.files[0];
  try {
    await deserialize(file);
  } catch (error) {
    throw error;
  }
  import_button.disabled = false;
  import_spinner.classList.add("hidden");
  make_preview();
  e.target.value = '';
};
