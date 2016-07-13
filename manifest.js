/**
 * Downloads a db dump from the Bungie manifest, creating a JSON file containing only what we need
 * {@link https://github.com/kyleshay/DIM/blob/master/build/processBungieManifest.js}.
 */

var fs = require('fs'),
    http = require('http'),
    mkdirp = require('mkdirp'),
    path = require('path'),
    Promise = require('promise'),
    request = require('request'),
    sqlite3 = require('sqlite3').verbose(),
    unzip = require('unzip');

var TEMP_FOLDER = './.tmp/manifest/',
    FILE_NAME = 'client/js/shared/definitions.js';

// ensure we have the temporary folder
mkdirp(TEMP_FOLDER, function (err) {
    if (err) {
        console.error(err);
        return;
    }
    // load the manifest from Bungie
    request.get({
        url: 'https://www.bungie.net/Platform/Destiny/Manifest/',
        headers: { 'X-API-Key': '10E792629C2A47E19356B8A79EEFA640' }
    }, onManifestResponse);
});

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

    // create the temporary folder for the language
    var languageFolder = path.join(TEMP_FOLDER, language);
    mkdirp(languageFolder, function() {
        // request the contents and create the zip file
        var zipFilePath = path.join(languageFolder, 'manifest.zip');
        request.get('https://www.bungie.net' + parsedResponse.Response.mobileWorldContentPaths[language])
            .pipe(fs.createWriteStream(zipFilePath))
            .on('close', function () {
                onManifestDownload(zipFilePath, language);
            });
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
        }),
        getDefinitions(db, 'DestinyTalentGridDefinition', 'TALENT_GRID', 'gridHash', talentGridMapper, function(definition) {
            return definition.gridHash && definition.nodes;
        })
    ]).then(writeDefinitionFile);
}

/**
 * Maps the definition from the database row, and adds it to the dictionary.
 * @param {Object} db The SQL database.
 * @param {String} tableName The table containing the definitions.
 * @param {String} alias The alias used to store the definitions against the top level object.
 * @param {String} key The key of each entry.
 * @param {String[]|Function} mapper The mapper; either an array of columns, or a delegate to select the object.
 * @param {Function} isValidEntry Determines if the SQL data row is a valid definition that we want to map.
 */
function getDefinitions(db, tableName, alias, key, mapper, isValidEntry) {
    var result = {};
    result[alias] = {};

    return new Promise(function(resolve, reject) {
        // transform the mapper if we need to
        if (Array.isArray(mapper)) {
            mapper = getMapperFromColumns(mapper);
        }

        // select all of the stat definitions
        db.all('SELECT * FROM ' + tableName, function (err, rows) {
            if (err) {
                throw err;
            }

            // check each row, determining if we can map it
            rows.forEach(function (row) {
                var definition = JSON.parse(row.json);

                if (isValidEntry(definition)) {
                    result[alias][definition[key]] = mapper(definition);
                }
            });

            resolve(result);
        });
    });
}

/**
 * Transforms a mapper that is represented as an array of columns, to a delegate function.
 * @param {String[]} columns The columns.
 * @returns {Function} The mapper used to map a definition.
 */
function getMapperFromColumns(columns) {
    return function(definition) {
        var result = {};
        columns.forEach(function(column) {
            result[column] = definition[column];
        });

        return result;
    }
}

/**
 * Maps a definition, parsing only the required information.
 * @param {Object} definition The raw definition.
 * @returns {Object} The parsed definition.
 */
function talentGridMapper(definition) {
    return {
        nodes: definition.nodes.map(function(node) {
            return {
                steps: node.steps.map(function(step) {
                    return {
                        nodeStepHash: step.nodeStepHash
                    };
                })
            };
        })
    };
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
    var contents = "(function() { 'use strict'; var app = angular.module('main').constant('BUNGIE_DEFINITIONS', " + JSON.stringify(definitions, null, 4) + "); })();",
        stream = fs.createWriteStream(FILE_NAME);

    // write the defintion file
    stream.write(contents);
    stream.end();

    console.log('Manifest saved to ' + FILE_NAME + '.');
}
