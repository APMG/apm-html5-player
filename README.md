# APM Player

A DOM-based javascript UI library for HTML5 audio, created for use on American Public Media and Minnesota Public Radio's websites.
Supports live streams and archived playback.

The library was designed for backwards compatibility with older javascript build systems, or even no build system, so it supports usage in a `<script>` tag, requirejs, commonjs, and ES6 imports.

## Table of Contents

[Dependencies](#dependencies)

[Installation](#installation)

- [NPM](#npm)
- [Bower](#bower)

[Importing](#importing)

- [ES6 Import](#es6-import)
- [CommonJS Syntax](#commonjs-syntax)
- [Require.js Syntax](#requirejs-syntax)
- [Script tag](#script-tag)

[Usage](#usage)

- [DOM Structure](#dom-structure)
  - [Inner Elements](#inner-elements)
  - [DOM Example](#dom-example)
- [Audio Formats](#audio-formats)
  - [Audio object array](#audio-object-array)
  - [Audio filename array](#audio-filename-array)
  - [Audio string](#audio-string)
- [Player State](#player-state)
  - [Player State Classes](#player-state-classes)
  - [Player State Example](#player-state-example)
- [JS Setup](#js-setup)
  - [ES6/Require.js Setup](#es6requirejs-setup)
  - [Global Setup](#global-setup)
- [Playlists](#playlists)

[Development Setup](#development-setup)

- [Linting](#linting)
- [Running a Build](#running-a-build)
- [Testing](#testing)

[Version History](#version-history)

## Dependencies

As of version 1.0.0, this library has no dependencies for usage. In previous versions, jQuery or a jQuery equivalent (such as Zepto) would need to be used alongside it.

## Installation

There are several ways to install APM Player on your site.

### NPM

The best supported method of installation going forward will be through NPM. To install in your project:

```sh
npm install --save apm-html5-player
```

or to use yarn:

```sh
yarn add apm-html5-player
```

### Bower

Some legacy apps don't use npm, so we can use [bower](https://bower.io) to manage the version of the player.

The package isn't registered with bower, so we have to reference the git url. If the repo is hosted on Gitlab (or somewhere else), change the url below to the appropriate repo url.

Add the package to your `bower.json` file:

```javascript
// in bower.json

"dependencies": {
  "apm-html5-player": "https://github.com/APMG/apm-html5-player.git#1.0.0",
}
```

Change the version number (after the `#`) to the appropriate version you need.

Then run:

```sh
bower install
```

## Importing

### ES6 Import

The easiest way to include this in modern javascript, assuming you are using something like Webpack and Babel, is to use an `import` statement.
The library uses named exports for all modules.

To import the player module:

```javascript
import { Player } from 'apm-html5-player';
```

If you need the player with the analytics plugin:

```javascript
import { Player, AudioAnalytics } from 'apm-html5-player';
```

### CommonJs Syntax

You can also use CommonJS `require()` functions to import the named modules like this:

```javascript
var Player = require('apm-html5-player').Player;
var AudioAnalytics = require('apm-html5-player').AudioAnalytics;
```

If using Require.js, this is the preferred syntax because it's easier to understand. To use a named package as demonstrated in the example above (the `'apm-html5-player'` string), you'll need to set up the module in Require.js's [`paths`](https://requirejs.org/docs/api.html#config-paths) config. Alternatively it can be referenced with a relative file path in the `require()` function.

### Require.js Syntax

If your app uses old-style require.js syntax for module importing, you can access the named modules like this, assuming Require.js's `paths` is configured:

```javascript
// Creates a new Player and AudioAnalytics
requirejs(['player'], function(ApmPlayer){
  // Get the DOM element
  var playerElement = document.getElementById('js-player');

  // Invoke the constructors
  var player = new ApmPlayer.player(playerElement);
  var analytics = new ApmPlayer.AudioAnalytics();

  // Initialize the player
  player.init();
}
```

### Script tag

This script can be used in the global namespace as well. Assuming you include your scripts in the bottom of your html document:

```html
<html>
  <head>
    <title>Player</title>
  </head>
  <body>
    <div class="js-player">...</div>

    <!-- path to the downloaded script -->
    <script src="/assets/vendor/ApmPlayer.js"></script>
    <!-- your custom javascript -->
    <script src="/assets/scripts/main.js"></script>
  </body>
</html>
```

The script is then accessible in the global namespace in your javascript by using `window.ApmPlayer`

## Usage

This library is DOM-based (i.e. it doesn't use something like props in React, but stores its configuration in the DOM).
It is invoked on a particular DOM element and expects various child elements to exist within that DOM element.

### DOM Structure

At a minimum, the library needs a containing element and an `<audio>` element in order to function. You can use any selector you want for this containing element, but subsequent examples assume we're using the class `js-player`:

```html
<div class="js-player">
  <audio></audio>
</div>
```

#### Inner Elements

Other DOM elements used by the library are selected by the following classes:

- `js-player-play`: The play/pause button. To change state of the button (to alternate between a play and pause icon), you can put the appropriate icons inside the button and show/hide based on the CSS state class applied to `js-player`. Can be multiple elements.
- `js-player-timeline`: The outer container of the scrubber. Must be a single element.
- `js-player-progress`: The element indicating the time elapsed inside the scrubber. Must be contained inside `js-player-timeline`. Must be a single element.
- `js-player-buffered`: The element indicating the loaded audio buffers. Must be contained inside `js-player-timeline` and should not contain any elements (or they will be overwritten). Must be a single element.
- `js-player-volume`: The outer container of the volume bar. Must be a single element.
- `js-player-volume-current`: The element indicating the current volume. Must be contained inside `js-player-volume`. Must be a single element.
- `js-player-mute`: The audio mute button. To change state of the button (to alternate between a mute and unmute icon), you can put the appropriate icons inside the button and show/hide based on the CSS state class applied to `js-player`. Must be a single element.
- `js-player-duration`: Displays the total length (in hh:mm:ss) of the audio which is currently loaded. Must be a single element.
- `js-player-currentTime`: Displays the current time of the currently loaded audio. Must be a single element.

#### DOM Example

The actual structure of the DOM is flexible, allowing for lots of different possible layouts, but here's an example of what it could look like (taken from The Current and abbreviated):

```html
<div class="player js-player" data-src="//current.stream.publicradio.org/kcmp.mp3">
  <audio></audio>
  <div class="player-main">
    <button type="button" class="player-control js-player-play" tabindex="0">
      <div class="player-play">
        <svg viewBox="0 0 24 24">
          <use xlink:href="#svg-play" />
        </svg>
      </div>
      <div class="player-pause">
        <svg viewBox="0 0 24 24">
          <use xlink:href="#svg-pause" />
        </svg>
      </div>
    </button>
    <div class="player-info">
      <div class="player-title js-update-title">Listen to The Current</div>
    </div>
    <div class="player-volume">
      <div class="player-volume-level js-player-volume">
        <div class="player-volume-current js-player-volume-current"></div>
      </div>
      <button type="button" class="player-volume-mute js-player-mute">
        <svg viewBox="0 0 24 24" class="player-unmuted">
          <use xlink:href="#svg-volume-up" />
        </svg>
        <svg viewBox="0 0 24 24" class="player-muted">
          <use xlink:href="#svg-volume-off" />
        </svg>
      </button>
    </div>
  </div>
  <div class="player-timeline js-player-timeline">
    <div class="player-progress js-player-progress"></div>
  </div>
  <div class="player-time">
    <div class="player-time-current js-player-currentTime"></div>
    <div class="player-time-duration js-player-duration"></div>
  </div>
</div>
```

Notice the additional classes used on elements with `js-*` classes. The additional classes should be used for styling, not the `js-*` classes, as those are meant to be only javascript hooks.

### Audio Formats

URLs to the audio files should be supplied to the `data-src` attribute on the main container element (`.js-player` in this example).
Once playback is initiated, the library will create the appropriate `<source>` element(s) inside the `<audio>` element and load the correct audio source before finally beginning playback.

The player can handle multiple audio sources, allowing the browser to use fallback formats if the OS or browser don't have the preferred codecs.

#### Audio object array

The most explicit, and generally preferred, way of defining the audio used in the player is by supplying an array with objects that detail the url and type of audio.
This is preferred if you know what formats your audio use so that the library doesn't have to guess based on the file extension.

Assume a JSON object that looks like this:

```json
[
  {
    "url": "https://example.com/my-audio.aac",
    "type": "audio/aac"
  },
  {
    "url": "https://example.com/my-audio.mp3",
    "type": "audio/mpeg"
  }
]
```

This provides a file in the AAC codec, which should use the `audio/aac` file container type as the preferred format, and the browser will fall back to the MP3 file (type `audio/mpeg`) if it can't play AAC audio.

To apply this to the DOM it should look like this. The JSON can use single quotes here instead of double quotes if preferred:

```html
<div class="js-player" data-src="[{'url': 'https://example.com/my-audio.aac', 'type': 'audio/aac'}, {'url': 'https://example.com/my-audio.mp3', 'type': 'audio/mpeg'}]">
  <audio></audio>
</div>
```

For reference, once this is parsed by the library after playback has been initiated, the `<audio>` element looks like this:

```html
<audio>
  <source src="https://example.com/my-audio.aac" type="audio/aac">
  <source src="https://example.com/my-audio.mp3" type="audio/mpeg">
</audio>
```

#### Audio filename array

If your data source that provides the audio urls doesn't provide information about the codec, you can just pass an array of url strings and the library will try to figure out the MIME types based on the filename:

```html
<div class="js-player" data-src="['https://example.com/my-audio.aac', 'https://example.com/my-audio.ogg', 'https://example.com/my-audio.mp3']">
  <audio></audio>
</div>
```

Resulting in:

```html
<audio>
  <source src="https://example.com/my-audio.aac" type="audio/aac">
  <source src="https://example.com/my-audio.ogg" type="audio/ogg">
  <source src="https://example.com/my-audio.mp3" type="audio/mpeg">
</audio>
```

If the library can't tell what `type` a file is from the filename, it will omit the `type` attribute from that `<source>` element.
The browser may still be able to play that audio file, but it might not work correctly.

#### Audio string

The library also accepts a simple string as the `data-src`:

```html
<div class="js-player" data-src="https://example.com/my-audio.mp3">
  <audio></audio>
</div>
```

Resulting in:

```html
<audio>
  <source src="https://example.com/my-audio.mp3" type="audio/mpeg">
</audio>
```

### Player State

The overall state of the player is communicated in the DOM by `is-*` classes on the main DOM element (the `js-player` element).
Any visual state changes of the player (alternating between the play and pause icons, for example) should use CSS to inherit the `is-*` class.

An exception to this rule of state classes is that the progress bar (scrubber) and the volume slider are set by javascript-driven inline styles to determine their width/height.

#### Player State Classes

All possible player state classes:

- `is-playing`: Added to the container after audio playback has been initiated or unpaused. Removed when audio is paused. If finite-length audio reches its end, this class is removed.
- `is-paused`: Added to the container when audio is paused. Removed when audio is playing. If the audio is a live stream (infinite length), this class is removed when the user "pauses" the stream because the audio is unloaded instead of just paused. This also means that when finite-length audio reaches its end, this class does not get added.
- `is-loading`: Added to the container when the browser is loading the audio file. Removed once playback has begun.
- `is-muted`: Added to the container if audio is muted (volume == 0). Removed if volume is greater than 0.

#### Player State Example

For example, to alternate between the play and pause icons, you might do something like this in the CSS, assuming the DOM example above:

```css
/* The default state, shows the play icon */
.player-play { display: block; }

/* The default state, hides the pause icon */
.player-pause { display: none; }

/* Using the is-playing class applied to containing .js-player to show the pause icon and hide the play icon */
.is-playing .player-play { display: none; }
.is-playing .player-pause { display: block; }
```

### JS Setup

Invoking the library in your app is fairly straightforward, and can be done in a few different ways depending on how you included the script in your app.

#### ES6/Require.js Setup

Assuming you imported or required the player using the existing exported name `Player` into your js file, invoke the script on your DOM element:

```javascript
// your custom js file

// The DOM element container
const playerElement = document.querySelector('.js-player');
// Create new instance of the Player class
const player = new Player(playerElement);

// Don't forget to initialize
player.init();
```

#### Global Setup

If you included the player library in your project in a `<script>` tag, the name in the global namespace is `ApmPlayer`. Otherwise usage is pretty similar to the ES6 example above:

```javascript
// your custom js file

var playerElement = document.querySelector('.js-player');
var player = new window.ApmPlayer.Player(playerElement);

// initialize the player
player.init();
```

### Playlists

This library includes functionality for managing a playlist in the DOM (included for backwards compatibility with some of our sites), but it's not recommended to use it for new projects.
The behavior isn't well-tested and stores its data in the DOM instead of in memory, meaning it is relatively brittle.
At this time it is recommended to write your own custom implementation to manage playlists if you need them.

## Development setup

We use [rollup.js](https://rollupjs.org) to build the javascript bundle and allows us to use `import` and `export`.
For easier backwards compatibility, this library doesn't use ES6 features other than import/export, and all javascript should be written in ES5 for the time being.

To get started, just clone this repo and then from the project directory run `npm install` or `yarn`. Then you can do the following:

### Linting

This project uses [eslint](https://eslint.org) and [prettier](https://prettier.io) for linting. Eslint catches various errors and anti-patterns in your code, while prettier checks and fixes formatting such as tabs/spaces, line length, etc.

To run all linters: `npm run lint`. This will give output in the terminal if eslint or prettier fail.

To have prettier fix your changes automatically: `npm run prettier:fix`

It is encouraged to have the linters run automatically in your code editor and/or on save. Make sure they are configured to use the `.eslintrc` and `.prettierrc` files.

### Running a build

To build the library, run `npm run build` and it will update the `bundle.js` file in the `dist` directory.
The dist directory is included in the repo so that the library can be used with Bower or without npm/yarn.

### Testing

TBD

## Version History

### 1.0.0

- Removes jquery dependency
- Supports multiple audio sources

### 0.4.x

- Published to NPM, adds index with modules for importing in ES6

### 0.3.x

- Allows use of a jQuery replacement such as Zepto

### 0.2.x and earlier

- jQuery is required
