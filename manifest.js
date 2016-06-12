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

var FILE_NAME = 'client/js/shared/definitions.js';

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

    Promise.all([
        getDefinitions(db, 'DestinyInventoryItemDefinition', 'ARMOR', 'itemHash', ['itemName', 'itemTypeName', 'itemDescription', 'icon', 'tierType', 'tierTypeName'], function(item) {
            return item.itemType === 2 || item.itemTypeName === 'Mask';
        }),
        getDefinitions(db, 'DestinyStatDefinition', 'STATS', 'statHash', ['statName'], function(stat) {
            return stat.statHash && stat.statName;
        })
    ]).then(writeDefinitionFile);
}

/**
 * Maps the definition from the database row, and adds it to the dictionary.
 * @param {Object} db The SQL database.
 * @param {String} tableName The table containing the definitions.
 * @param {String} alias The alias used to store the definitions against the top level object.
 * @param {String} key The key of each entry.
 * @param {String[]} columns Columns to map from the SQL data row.
 * @param {Function} isValidEntry Determines if the SQL data row is a valid definition that we want to map.
 */
function getDefinitions(db, tableName, alias, key, columns, isValidEntry) {
    var result = {};
    result[alias] = {};

    return new Promise(function(resolve, reject) {
        // select all of the stat definitions
        db.all('SELECT * FROM ' + tableName, function (err, rows) {
            if (err) {
                throw err;
            }

            // map each row
            rows.forEach(function (row) {
                mapDefinition(result[alias], row, key, columns, isValidEntry);
            });

            resolve(result);
        });
    });
}

/**
 * Maps the definition from the database row, and adds it to the dictionary.
 * @param {Object} dictionary The dictionary containing all of the definitions for the type.
 * @param {Object} row The SQL data row.
 * @param {String} key The key of each entry.
 * @param {String[]} columns Columns to map from the SQL data row.
 * @param {Function} isValidEntry Determines if the SQL data row is a valid definition that we want to map.
 */
function mapDefinition(dictionary, row, key, columns, isValidEntry) {
    var definition = JSON.parse(row.json);

    // only map the definition if it is considered valid
    if (isValidEntry(definition)) {
        var hash = definition[key];
        dictionary[hash] = {};

        // map each of the columns
        columns.forEach(function(column) {
            dictionary[hash][column] = definition[column];
        });
    }
}

/**
 * Writes a definition file, serializing the data to a JSON string.
 * @param {Object[]} definitionResults The definitions to be written to file.
 */
function writeDefinitionFile(definitionResults) {
    var definitions = {};

    // re-map the results to an object
    definitionResults.forEach(function(definition) {
        for (var key in definition) {
            definitions[key] = definition[key];
        }
    })

    // determine the contents and open a write stream
    var contents = "(function() { 'use strict'; var app = angular.module('main').constant('BUNGIE_DEFINITIONS', " + JSON.stringify(definitions, null, 4) + "); })();"
    //var contents = 'var BUNGIE_DEFINITIONS = ' + JSON.stringify(definitions, null, 4) + ';',
        stream = fs.createWriteStream(FILE_NAME);

    // write the defintion file
    stream.write(contents);
    stream.end();

    console.log('Manifest saved to ' + FILE_NAME + '.');
}
