module.controller('kioskController', ['$scope', 'QuService', function ($scope, QuService) {
    var socket = QuService.getSocket();

    $scope.queueId = localStorage.getItem("clientQueueId");
    $scope.homeScreen = $scope.queueId == null;
    $scope.connected = false;
    $scope.registered = false;

    var reconnect = function (queueId) {
        socket.emit("connectClient", {
            queueId: $scope.queueId
        }, function (response) {
            if (response) {
                $scope.topics = response.topics;
                $scope.registered = true;
            } else {
                setTimeout(reconnect, 1000);
            }
            $scope.$apply();
        });
    }

    socket.on("connect", function () {
        $scope.connected = true;

        if (!$scope.homeScreen) {
            reconnect();
        }

        $scope.$apply();
    });

    socket.on("disconnect", function () {
        $scope.connected = false;
        $scope.registered = false;

        $scope.$apply();
    });

    $scope.connectClient = function () {
        socket.emit("connectClient", {
            queueId: $scope.queueId
        }, function (response) {
            if (response) {
                $scope.topics = response.topics;
                $scope.queueId = response.queueId;
                $scope.registered = true;
                $scope.homeScreen = false;
            } else {
                $scope.errorMessage = "can't connect";
                $(".error-message")
                    .css("opacity", "1")
                    .animate({
                        opacity: 0
                    }, {
                        duration: 2000,
                        queue: false
                    });
            }
            $scope.$apply();
        });
    }

    $scope.newClient = function (topic) {
        var number = Math.round(Math.random() * 1000);
        socket.emit("newClient", {
            name: number,
            topic: topic,
            id: new Date().getTime()
        }, function (response) {
            if (response) {
                $scope.userMessage = number;
                $scope.messageIsActive = true;
                $(".user-message").css("opacity", "1");
                $(".user-message").animate({
                    opacity: 0
                }, {
                    duration: 5000,
                    queue: false,
                    always: function () {
                        $scope.messageIsActive = false;
                        $scope.$apply();
                    }
                });
            } else {
                console.error("error");
            }
            $scope.$apply();
        });
    }
    }]);