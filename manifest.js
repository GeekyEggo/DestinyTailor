/**
 * Downloads a db dump from the Bungie manifest, creating a JSON file containing only what we need
 * {@link https://github.com/kyleshay/DIM/blob/master/build/processBungieManifest.js}.
 */

var fs = require('fs'),
    http = require('http'),
    request = require('request'),
    sqlite3 = require('sqlite3').verbose(),
    unzip = require('unzip');

// load the manifest from Bungie
request.get({
    url: 'https://www.bungie.net/Platform/Destiny/Manifest/',
    headers: { 'X-API-Key': '10E792629C2A47E19356B8A79EEFA640' }
}, onManifestResponse);

/**
 * Writes a definition file, serializing the data to a JSON string.
 * @param {String} path The path of the file to write to.
 * @param {String} name The variable name.
 * @param {Object} data Object containing the definitions to serialize.
 */
function writeDefinitionFile(path, name, data) {
    var contents = 'var ' + name + ' = ' + JSON.stringify(data, null, 4) + ';',
    stream = fs.createWriteStream(path);

    stream.write(contents);
    stream.end();
}

/**
 * Handles the response from requesting the manifest from Bungie.
 * @param {Object} error The error.
 * @param {Object} response The response from the request.
 * @param {Object} body The body of the request.
 */
function onManifestResponse(error, response, body) {
    var parsedResponse = JSON.parse(body),
        version = parsedResponse.Response.version,
        language = 'en';

    console.log('Downloading zip for ' + language + '.');

    var zipFilePath = 'manifest/' + language + '/manifest.zip';
    request.get('https://www.bungie.net' + parsedResponse.Response.mobileWorldContentPaths[language])
        .pipe(fs.createWriteStream(zipFilePath))
        .on('close', function () {
            onManifestDownloaded(zipFilePath, language);
        });
}

/**
 * Handles a manifest being downloaded from Bungie; decompressing and extracting the information.
 * @param {String} zipFilePath The file path to the compressed manifest.
 * @param {String} language The language of the manifest file.
 */
function onManifestDownloaded(zipFilePath, language) {
    console.log('Processing zip for ' + language);

    fs.createReadStream(zipFilePath)
        .pipe(unzip.Parse())
        .on('entry', function (entry) {
            var path = 'manifest/' + language + '/' + entry.path;
            ws = fs.createWriteStream(path)
            ws.on('finish', function () {
                if (fs.existsSync(path)) {
                    exportDefinitionsFromDb(path, language);
                }
            });
            entry.pipe(ws);
        });
}

/**
 * Exports the required definitions from the database file.
 * @param {Object} dbFile The database file.
 * @param {String} language The language of the original manifest.
 */
function exportDefinitionsFromDb(dbFile, language) {
    var db = new sqlite3.Database(dbFile);

    db.all('SELECT * FROM DestinyInventoryItemDefinition', function (err, rows) {
        if (err) throw err;

        var DestinyArmorDefinition = {};

        rows.forEach(function (row) {
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

        writeDefinitionFile('client/js/shared/DestinyArmorDefinition.js', 'DestinyArmorDefinition', DestinyArmorDefinition);
    });

    db.all('SELECT * FROM DestinyStatDefinition', function (err, rows) {
        if (err) throw err;

        var DestinyStatDefinition = {};

        rows.forEach(function (row) {
            var item = JSON.parse(row.json);
            if (item.statHash && item.statName) {
                DestinyStatDefinition[item.statHash] = {};
                DestinyStatDefinition[item.statHash].statName = item.statName;
            }
        });

        writeDefinitionFile('client/js/shared/DestinyStatDefinition.js', 'DestinyStatDefinition', DestinyStatDefinition);
    });
}
