module.controller('displayController', ['$scope', 'QuService', function ($scope, QuService) {
    var socket = QuService.getSocket();

    $scope.queueId = null;//localStorage.getItem("clientQueueId");
    $scope.homeScreen = $scope.queueId == null;
    $scope.connected = false;
    $scope.registered = false;

    var reconnect = function (queueId) {
        socket.emit("connectDisplay", {
            queueId: $scope.queueId
        }, function (response) {
            if (response) {
                $scope.registered = true;
                $scope.clients = response.clients;
            } else {
                setTimeout(reconnect, 1000);
            }
            $scope.$apply();
        });
    }

    $scope.connect = function () {
        socket.emit("connectDisplay", {
            queueId: $scope.queueId
        }, function (response) {
            if (response) {
                $scope.registered = true;
                $scope.homeScreen = false;
                $scope.clients = response.clients;
            } else {
                $scope.errorMessage = response.errorMessage;
                $(".error-message").css("opacity", "1");
                $(".error-message").animate({
                    opacity: 0
                }, {
                    duration: 2000,
                    queue: false
                });

                $scope.errorMessage = response.errorMessage;
            }
            $scope.$apply();
        });
    }

    socket.on('connect', function () {
        $scope.connected = true;
        if (!$scope.homeScreen) {
            reconnect();
        }
        $scope.$apply();
    });

    socket.on("queueUpdate", function (data) {
        $scope.clients = data.clients;
        $scope.$apply();
    });

    socket.on('disconnect', function () {
        $scope.connected = false;
        $scope.registered = false;
        $scope.$apply();
    });

    socket.on('closeQueue', function () {
        $scope.registered = false;
        reconnect();
    });
    }]);