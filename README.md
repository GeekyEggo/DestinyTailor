# Destiny Tailor

Destiny Tailor is a site designed to help fellow guardians get the most out of their hard earned gear. By using Bungie's API, Destiny Tailor is able to evaluate your equipped gear, and with a bit of number crunching, provide you with a list of available "stat profiles".

A "stat profile" is the term we use for a specific combinations of stats on your gear, e.g. choosing intellect over strength, which was introduced with Destiny year 2 items. This can proove really useful if, like us, you enjoy swapping your item stats to get the most out of them for the right situation, i.e. raiding, trials, or just a bit of casual striking.

## Releases

### 0.5

- Performance improvements.
- Added error warnings when Bungie API calls fail.
- **0.5.1**
 - Added Bungie manifest file (removing the need of `?definitions=true`). Many thanks to @v-fedorov.

### 0.4

- Added account and character static links.
- Inventories now load quicker (client-side).
- Minor UI fixes.
- 0.4.1
 - Minor improvements to UI (removed flashing elements).
- 0.4.2
 - Minor fixes to SPA parameter cases.
 - Added auto focusing on initial load.
 - Updated gulp minification.
- 0.4.2a
 - Hotfix; searching for an XBox gamertag sometimes returned multiple matching results.

### 0.3

- Subtle UX animation improvements.
- Added loading indicator.
- Improved Angular binding performance throughout.
- Added gzip compression, and cache-busting.

### 0.2

- Mobile
 - Significant improvements to mobile viewing.
  - Much easier to see characters
  - Items are now fully visible.
- Inventory
 - Greatly improved visibility of inventory.
 - Inventory can now be toggled.
- Clearer character selection.
- Fixed issue with filtering stat profiles.

### 0.1

- Searching
  - Quickly search Bungie for your character on either XBox or PSN.
- Stat profiles
  - New; character stat profile evaluation.
  - Clearly see all available stat profiles, and their intellect, discipline and strength yields.
  - See how stat profiles can be achieved by selecting them!

## Contributing - Getting started

Currently only available locally, Destiny Tailor is built in Node.js running Express as the backend server. Getting started locally is easy, here's what you'll need.

#### Prerequisites
* Node.js installed
* An API key from [Bungie.net](https://www.bungie.net/en/User/API)

#### Setup
1. `clone` the repository to a local directoy
2. Install all the dependencies using `npm i`
3. Create a local `.env` file in the root, adding your API (format `API_KEY={key}`)
4. Start the site locally with `npm start`; default address [http://localhost:3000/](http://localhost:3000/)

## About the project

This is very much a "discovery" project; after realising it was possible via the Bungie API, I've decided to step outside of my comfort realms of .NET, and have a proper go with Node.js and Angular. All feedback is appreciated; both positive or ~~negative~~ *constructive*, so please feel free to contact me here, or on PSN via @GeekyEggo.