Storage.prototype.setObject = function (key, value) {
    this.setItem(key, angular.toJson(value));
}

Storage.prototype.getObject = function (key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
}

var module = angular.module('noquApp', ['ui.utils']);

module.directive('focusOnShow', function ($timeout) {
    return {
        restrict: 'A',
        link: function ($scope, $element, $attr) {
            if ($attr.ngShow) {
                $scope.$watch($attr.ngShow, function (newValue) {
                    if (newValue) {
                        $timeout(function () {
                            $($element).focus();
                        }, 0);
                    }
                })
            }
            if ($attr.ngHide) {
                $scope.$watch($attr.ngHide, function (newValue) {
                    if (!newValue) {
                        $timeout(function () {
                            $($element).focus();
                        }, 0);
                    }
                })
            }

        }
    };
});

module.factory('QuService', ['$http', function ($http) {
    return {
        getSocket: function () {
            var result = null;
            if (window.location.hostname == "app.noqu.me") {
                result = io.connect('http://app.noqu.me:8000', {
                    'forceNew': true
                });
            } else {
                result = io.connect();
            }

            return result;
        }
    }
    }]);