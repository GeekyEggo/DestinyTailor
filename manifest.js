// Downloads DB dump from bungie manifest and creates our definition files
// Taken and modified from kyleshays DIM repo
// https://github.com/kyleshay/DIM/blob/master/build/processBungieManifest.js

var http = require('http');
var fs = require('fs');
var request = require('request');
var sqlite3 = require('sqlite3').verbose();
var unzip = require('unzip');

function writeDefinitionFile(path, name, data) {
  var stream = fs.createWriteStream(path);
  stream.write('var ' + name + ' = ');
  stream.write(JSON.stringify(data, null, 2));
  stream.write(';');
  stream.end();
}

function onManifestRequest(error, response, body) {
  var parsedResponse = JSON.parse(body);
  var version = parsedResponse.Response.version;
  var language = 'en';
  
  console.log('Downloading zip for ' + language + '.');
  var zip = 'manifest/' + language + '/manifest.zip';
  (function (zip, language) {
    request
      .get('https://www.bungie.net' + parsedResponse.Response.mobileWorldContentPaths[language])
      .pipe(fs.createWriteStream(zip))
      .on('close', function () {
        onManifestDownloaded(zip, language);
      });
  })(zip, language);
}

function onManifestDownloaded(zip, language) {
  console.log('Processing zip for ' + language);
  fs.createReadStream(zip)
    .pipe(unzip.Parse())
    .on('entry', function (entry) {
      var path = 'manifest/' + language + '/' + entry.path;
      ws = fs.createWriteStream(path)
      ws.on('finish', function () {
        if (fs.existsSync(path)) {
          extractDB(path, language);
        }
      });
      entry.pipe(ws);
    });
}

function extractDB(dbFile, language) {
  db = new sqlite3.Database(dbFile);

  db.all('SELECT * FROM DestinyInventoryItemDefinition', function(err, rows) {
    if (err) throw err;

    var DestinyArmorDefinition = {};

    rows.forEach(function(row) {
      var item = JSON.parse(row.json);

      // Armor
      if ((item.itemType === 2) || (item.itemTypeName === 'Mask')) {
        DestinyArmorDefinition[item.itemHash] = {};
        DestinyArmorDefinition[item.itemHash].itemName = item.itemName;
        DestinyArmorDefinition[item.itemHash].itemTypeName = item.itemTypeName;
        DestinyArmorDefinition[item.itemHash].itemDescription = item.itemDescription;
        DestinyArmorDefinition[item.itemHash].icon = item.icon;
        DestinyArmorDefinition[item.itemHash].tierType = item.tierType;
        DestinyArmorDefinition[item.itemHash].tierTypeName = item.tierTypeName;
      }

    });

    writeDefinitionFile('client/js/shared/DestinyArmorDefinition.js',    'DestinyArmorDefinition',    DestinyArmorDefinition);
  });

  db.all('SELECT * FROM DestinyStatDefinition', function(err, rows) {
    if (err) throw err;

    var DestinyStatDefinition = {};

    rows.forEach(function(row) {
      var item = JSON.parse(row.json);
      if (item.statHash && item.statName) {
        DestinyStatDefinition[item.statHash] = {};
        DestinyStatDefinition[item.statHash].statName = item.statName;
      }
    });

    writeDefinitionFile('client/js/shared/DestinyStatDefinition.js',    'DestinyStatDefinition',    DestinyStatDefinition);
  });
}

request.get({
  url: 'https://www.bungie.net/Platform/Destiny/Manifest/',
  headers: {'X-API-Key':'10E792629C2A47E19356B8A79EEFA640'}
}, onManifestRequest);
