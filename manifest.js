/**
 * Downloads a db dump from the Bungie manifest, creating a JSON file containing only what we need
 * {@link https://github.com/kyleshay/DIM/blob/master/build/processBungieManifest.js}.
 */

var fs = require('fs'),
    http = require('http'),
    Promise = require('promise'),
    request = require('request'),
    sqlite3 = require('sqlite3').verbose(),
    unzip = require('unzip');

// load the manifest from Bungie
request.get({
    url: 'https://www.bungie.net/Platform/Destiny/Manifest/',
    headers: { 'X-API-Key': '10E792629C2A47E19356B8A79EEFA640' }
}, onManifestResponse);

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

    console.log('Downloading zip for ' + language + '...');

    var zipFilePath = 'manifest/' + language + '/manifest.zip';
    request.get('https://www.bungie.net' + parsedResponse.Response.mobileWorldContentPaths[language])
        .pipe(fs.createWriteStream(zipFilePath))
        .on('close', function () {
            onManifestDownload(zipFilePath, language);
        });
}

/**
 * Handles a manifest being downloaded from Bungie; decompressing and extracting the information.
 * @param {String} zipFilePath The file path to the compressed manifest.
 * @param {String} language The language of the manifest file.
 */
function onManifestDownload(zipFilePath, language) {
    console.log('Processing zip for ' + language + '...');

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

    getArmorDefinitions(db)
        .then(appendStatDefinitions)
        .then(function(result) {
            var fileName = 'client/js/shared/definitions.js';
            writeDefinitionFile(fileName, 'DEFINITIONS', result.definitions);
            console.log('Saved to ' + fileName);
        });
}

/**
 * Gets the armor definitions and their required information from the database.
 * @param {Object} db The manifest database.
 * @returns {Object} A promise containing the database and the current definitions.
 */
function getArmorDefinitions(db) {
    // define the definitions and add the armor object
    var definitions = {};
    definitions.ARMOR = {};

    return new Promise(function(resolve, reject) {
        // select the information from the database
        db.all('SELECT * FROM DestinyInventoryItemDefinition', function (err, rows) {
            if (err) {
                throw err;
            }

            // add each item when the type is 2, or the name is 'Mask' (event based)
            rows.forEach(function (row) {
                var item = JSON.parse(row.json);
                if ((item.itemType === 2) || (item.itemTypeName === 'Mask')) {
                    definitions.ARMOR[item.itemHash] = getItemData(item);
                }
            });

            // resolve for the next chain
            resolve({
                db: db,
                definitions: definitions
            });
        });
    });
}

/**
 * Gets the required information from the complete item definitions.
 * @param {Object} itemDefinition The item definition from Bungie.
 * @returns {Object} The required item information.
 */
function getItemData(itemDefinition) {
    return {
        itemName: itemDefinition.itemName,
        itemTypeName: itemDefinition.itemTypeName,
        itemDescription: itemDefinition.itemDescription,
        icon: itemDefinition.icon,
        tierType: itemDefinition.tierType,
        tierTypeName:itemDefinition.tierTypeName
    }
}

/**
 * Appends the stat definitions to an already existing extraction.
 * @param {Object} result The current extraction results.
 * @returns {Object} A promise containing the database and the current definitions.
 */
function appendStatDefinitions(result) {
    // ensure we have definitions and the stats object
    result.definitions = result.definitions || {};
    result.definitions.STATS = {}

    return new Promise(function(resolve, reject) {
        // select all of the stat definitions
        result.db.all('SELECT * FROM DestinyStatDefinition', function (err, rows) {
            if (err) {
                throw err;
            }

            rows.forEach(function (row) {
                var stat = JSON.parse(row.json);

                if (stat.statHash && stat.statName) {
                    result.definitions.STATS[stat.statHash] = {
                        statName: stat.statName
                    };
                }
            });

            resolve(result);
        });
    });
}

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
