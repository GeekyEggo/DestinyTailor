(function() {
    'use strict';

    angular.module('main').controller('searchController', SearchController);
    SearchController.$inject = ['$scope', '$state', 'userService'];

    /**
     * The search controller, primarily used to search for a user's account with Bungie.
     * @param {Object} $scope The scope of the controller.
     * @param {Object} $state The state provider helper.
     * @param {Object} userService The user service.
     */
    function SearchController($scope, $state, userService) {
        var PLATFORM_PSN = true;

        $scope.error = '';
        $scope.isSearching = false;
        $scope.platform = PLATFORM_PSN;

        /**
         * Searches for a character and updates the account in the user service.
         */
        $scope.search = function() {
            // clear the current scope and search
            $scope.clearError();
            $state.go('search.account', {
                membershipTypeName: $scope.platform === PLATFORM_PSN ? 'psn' : 'xbox',
                displayName: $scope.name.toLowerCase()
            });
        };

        /**
         * Clears any error messages.
         */
        $scope.clearError = function() {
            $scope.error = '';
        };

        // register the error handler
        $scope.$on('search.error', function(ev, message) {
            $scope.error = message;
        });

        // register the search loader events
        $scope.$on('search.start', toggleSearching);
        $scope.$on('search.stop', toggleSearching);

        // update the search box
        $scope.$on('account.change', function(ev, account) {
            $scope.name = account.displayName;
        });

        /**
         * Handles toggling the loading state, based on the event type.
         * @param {Object} ev The event object.
         */
        function toggleSearching(ev) {
            $scope.isSearching = ev.name === 'search.start';
        }
    }
})();
