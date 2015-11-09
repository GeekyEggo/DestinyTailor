(function(app) {
    'use strict';

    /**
     * The search controller, primarily used to search for a user's account / membership with Bungie.
     * @param {Object} $scope The scope of the controller.
     * @param {Object} $http The http utils from Angular.
     * @param {Object} PLATFORM The constant containing the platform API numbers.
     * @param {Object} userService The user service.
     */
    var SearchController = function($scope, $http, PLATFORM, userService) {
        var PLATFORM_PSN = true;
        $scope.platform = PLATFORM_PSN;

        /**
         * Searches for a character and updates the account in the user service.
         */
        $scope.search = function() {
            var platformId = $scope.platform === PLATFORM_PSN ? PLATFORM.psn : PLATFORM.xbox;
            var path = '/api/' + platformId + '/' + encodeURIComponent($scope.name) + '/';

            $scope.isLoading = true;

            // begin the request
            $http.get(path).then(function(result) {
                $scope.isLoading = false;
                if (result.data === null) {
                    $scope.error = 'Unable to find character.';
                } else {
                    userService.account = result.data;
                }
            }, function(err) {
                $scope.isLoading = false;
                $scope.error = err.statusText;
            });
        };
    };

    SearchController.$inject = ['$scope', '$http', 'PLATFORM', 'userService'];
    app.controller('searchController', SearchController);
})(angular.module('destinyTailorApp'));
