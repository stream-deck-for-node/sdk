# [Elgato released an official Node.js sdk](https://github.com/elgatosf/streamdeck)
> Now they support Node.js plugins, hot reload and more.
> 
> _This project is now archived_

------


<p align="center">
  <img src="https://stream-deck-for-node.netlify.app/_media/icon.png">
</p>
<h1 align="center">Elgato Stream Deck SDK</h1>
<p align="center">Unofficial Node.js SDK</p>
<p align="center">
  <a href="https://ci.appveyor.com/project/fcannizzaro/stream-deck-for-node-sdk"><img src="https://ci.appveyor.com/api/projects/status/aafqc84k1crqo6w6?svg=true"></a>
  <a href="https://www.npmjs.com/package/@stream-deck-for-node/sdk"><img src="https://img.shields.io/npm/v/@stream-deck-for-node/sdk?style=flat&color=red"></a>
  <img src="https://img.shields.io/badge/written%20in-TypeScript-blue?style=flat">
</p>

# Library Features

- Allow the creation and building of a Node.js plugin (not everything can be done with the internal JavaScript in the
  Stream Deck App)
- Strictly typed
- Simplify the plugin's development
- Auto-populate the plugin settings
- Single / double taps and long press managed events
- Automatically handles image url, file or Base64 images
- Easy debugging + development (no stream deck application's reload necessary!)
- Per action class development (not worry about checking every time the action UUID)

## Samples

There are different types of sample (in the directory `/sample`), written in JavaScript and TypeScript and also a built
plugin.

## Documentation

You can read the full documentation at https://stream-deck-for-node.netlify.app

## TODO

- Testing on **Mac**

## Changelog

### 1.0 (12/2021)

An initial sdk version is released

## Inspiration

I took my inspiration from [streamdeck-tools](https://github.com/BarRaider/streamdeck-tools)
of [BarRaider](https://github.com/BarRaider), but I don't really like `C#`... so I created a tool to execute on-fly Node.js
script through a binary executable or a full node packaged app.

## Author

Francesco Saverio Cannizzaro ([fcannizzaro](https://github.com/fcannizzaro))

## License

GPL-3.0
