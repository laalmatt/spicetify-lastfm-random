# spicetify-lastfm-random
Add on that gets a random artist to Spotify from your Last.fm profile


🎲 Last.fm Random Artist for Spicetify

A simple Spicetify extension that helps you rediscover forgotten music from your Last.fm listening history.

Ever feel like you're listening to the same artists over and over again, even though you've listened to hundreds or thousands of artists in the past?

Last.fm Random Artist adds a random artist button to Spotify Desktop, allowing you to rediscover artists from your own listening history with a single click.

Features

🎲 Pick a random artist from your Last.fm library

🎧 Open the selected artist in Spotify search

🔢 Filter artists by minimum play count

⚖️ Equal probability for every eligible artist, regardless of play count

💾 Cache artist data to reduce unnecessary API requests

🔄 Rediscover artists you might have forgotten about

Requirements

Spotify Desktop

Spicetify

A Last.fm account

A Last.fm API key

Installation

Install Spicetify.

Download lastfmRandomArtist.js from this repository.

Copy the file to your Spicetify Extensions directory.

On Windows:

%APPDATA%\spicetify\Extensions

Open PowerShell and run:

spicetify config extensions lastfmRandomArtist.js
spicetify apply

Restart Spotify Desktop.

A dice button should now appear in Spotify.

Configuration

On first use, configure your Last.fm username and API key.

You can obtain a Last.fm API key at:

https://www.last.fm/api/account/create

The extension also allows you to configure the minimum number of scrobbles required for an artist to be included in the random selection.

For example, setting the minimum play count to 20 excludes artists with 20 or fewer scrobbles.

How it works

The extension fetches your artist library using the Last.fm API.

Artists below the configured play count threshold are excluded.

An artist is selected randomly from the remaining list.

Spotify search opens with the selected artist's name.

Every eligible artist has an equal chance of being selected.

This means an artist with 30 scrobbles has the same probability of being selected as an artist with 3,000 scrobbles.

Limitations

Requires an internet connection to retrieve artist data.

Spotify search may return multiple results for artists with similar names.

The extension does not automatically start playback.

Compatibility may be affected by future Spotify or Spicetify updates.

Project status

This is a small experimental hobby project built to solve a personal problem.

The extension is provided as-is, and compatibility with every Spotify or Spicetify version is not guaranteed.

Bug reports, suggestions and contributions are welcome!

Disclaimer

This project is not affiliated with, endorsed by, or officially connected to Spotify, Last.fm or Spicetify.

License

MIT License.
