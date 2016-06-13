(function() {
    'use strict';

    angular.module('main').factory('bungieService', bungieService);
    bungieService.$inject = ['httpUtils'];

    /**
     * Defines the Bungie service, used to communicate with Bungie.
     * @param {Object} httpUtils Provides HTTP utilities.
     * @returns {Object} The inventory service.
     */
    function bungieService(httpUtils) {
        return {
            // functions
            getAccountSummary: getAccountSummary,
            getInventorySummary: getInventorySummary,
            getItemDetails: getItemDetails,
            searchDestinyPlayer: searchDestinyPlayer,

            // helpers
            throwErrors: throwErrors
        };

        /**
         * Gets the account summary for a membership.
         * @param {Number} membershipType The membership type; either 1 for xbox, or 2 for PSN.
         * @param {Number} membershipId The identifier for the membership.
         * @returns {Object} The result of requesting the account summary.
         */
        function getAccountSummary(membershipType, membershipId) {
            return httpUtils.get(
                '/Platform/Destiny/{membershipType}/Account/{membershipId}/',
                {
                    membershipType: membershipType,
                    membershipId: membershipId
                });
        }

        /**
         * Gets the item detail for a given item instance.
         * @param {Number} membershipType The membership type; either 1 for xbox, or 2 for PSN.
         * @param {Number} membershipId The identifier for the membership.
         * @param {Number} characterId The identifier for the character.
         * @returns {Object} The result of requesting the inventory summary.
         */
        function getInventorySummary(membershipType, membershipId, characterId) {
            return httpUtils.get(
                '/Platform/Destiny/{membershipType}/Account/{membershipId}/Character/{characterId}/Inventory/Summary/',
                {
                    membershipType: membershipType,
                    membershipId: membershipId,
                    characterId: characterId
                });
        }

        /**
         * Gets the item detail for a given item instance.
         * @param {Number} membershipType The membership type; either 1 for xbox, or 2 for PSN.
         * @param {Number} membershipId The identifier for the membership.
         * @param {Number} characterId The identifier for the character.
         * @param {Number} itemInstanceId The identifier for the item instance.
         * @returns {Object} The result of requesting the item details.
         */
        function getItemDetails(membershipType, membershipId, characterId, itemInstanceId) {
            return httpUtils.get(
                '/Platform/Destiny/{membershipType}/Account/{membershipId}/Character/{characterId}/Inventory/{itemInstanceId}/',
                {
                    membershipType: membershipType,
                    membershipId: membershipId,
                    characterId: characterId,
                    itemInstanceId: itemInstanceId
                });
        }

        /**
         * Searches for a Destiny membership by their membership type and display name.
         * @param {Number} membershipType The membership type; either 1 for xbox, or 2 for PSN.
         * @param {String} displayName The display name to search for.
         * @returns {Object} The result of the search.
         */
        function searchDestinyPlayer(membershipType, displayName) {
            return httpUtils.get(
                 '/Platform/Destiny/SearchDestinyPlayer/{membershipType}/{searchCriteria}/',
                 {
                     membershipType: membershipType,
                     searchCriteria: encodeURIComponent(displayName)
                 });
        }

        /**
         * Handles any request errors.
         * @param {Object} result The API result to check.
         * @returns {Object} The API result.
         */
        function throwErrors(result) {
            // check the result status
            if (result.status !== 200) {
                throw 'Unable to connect to Bungie';
            }

            // accept if the error code is okay
            if (result.data.ErrorCode === 1) {
                return result;
            }

            throw result.data.Message;
        }
    }
})();
