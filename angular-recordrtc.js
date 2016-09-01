(function() {
  'use strict';

  var module = angular.module('recordrtc', []);

  var isMobileDevice = (function() {
    var check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
  })();

  module.provider('recordrtc', [function() {
    var configuration = {};

    this.defaultConfiguration = function(config) {
      configuration = config;
    }

    this.$get = ['$q', function($q) {
      var factory = {};
      initializeGetUserMedia($q);

      /**
       * Get the default configuration.
       * @type {object}
       **/
      Object.defineProperty(factory, 'config', {
        get: function() {
          var result = {
            label: 'Recorder',
            constraints: {
              audio: true,
              video: {
                width: 1280,
                height: 720
              }
            },
            recordrtc: {                  // http://recordrtc.org/
              mimeType: 'video/webm',     // or video/mp4 or audio/ogg
              audioBitsPerSecond: 128000,
              videoBitsPerSecond: 128000,
              bitsPerSecond: 128000       // if this line is provided, skip above two
            }
          };
          return angular.extend(result, configuration);
        }
      });

      /**
       * Get a stream object.
       * @param {object} [constraints] The media stream constraints configuration.
       * Defaults to recordrtc provider default configuration constraints.
       * @returns {Promise<stream>, undefined}
       **/
      factory.getStream = function(constraints) {
        if (!constraints) constraints = factory.config.constraints;
        return $q(function(resolve, reject) {
          navigator.mediaDevices.getUserMedia(constraints)
            .then(
              function(stream) {
                resolve({
                  stream: stream,
                  url: window.URL.createObjectURL(stream)
                });
              },
              function(err) {
                reject(err);
              }
            );
        });
      }

      return factory;
    }];

  }]);

  module.directive('recordRtc', ['recordrtc', function(recordrtc) {
    return {
      restrict: 'E',
      template:
        '<div class="record-rtc-button">' +
        '  <div><button type="button" class="btn btn-default" ng-click="ctrl.show()">Record Video</button></div>' +
        '  <div><input type="file" accept="video/*;capture=camcorder" class="filestyle" data-buttonText="{{label}}" data-input="false" data-icon="false"></div>' +
        '</div>' +
        '<div class="record-rtc-backdrop">' +
        '  <div class="record-rtc-outer">' +
        '    <div class="record-rtc-inner record-rtc-widescreen">' +
        '      <video class="record-rtc-video"></video>' +
        '      <div class="record-rtc-messages">' +
        '        <div class="record-rtc-message-playing">Playback</div>' +
        '        <div class="record-rtc-message-recording">Recording</div>' +
        '      </div>' +
        '      <div class="record-rtc-close" ng-click="ctrl.hide()">&times;</div>' +
        '      <div class="record-rtc-controls">' +
        '        <button type="button" class="record-rtc-record" ng-click="ctrl.startRecording()">' +
        '          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24">' +
        '            <path fill="#fff" d="M18 12c0-1.657-0.672-3.157-1.757-4.243-1.086-1.085-2.586-1.757-4.243-1.757-1.656 0-3.156 0.672-4.242 1.757-1.086 1.086-1.758 2.586-1.758 4.243 0 1.656 0.672 3.156 1.758 4.242s2.586 1.758 4.242 1.758c1.657 0 3.157-0.672 4.243-1.758 1.085-1.086 1.757-2.586 1.757-4.242z"></path>' +
        '          </svg>' +
        '        </button>' +
        '        <button type="button" class="record-rtc-play" ng-click="ctrl.playback()" style="display: none">' +
        '          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24">' +
        '            <path fill="#fff" d="M10.396 18.433c2.641-2.574 6.604-6.433 6.604-6.433s-3.963-3.859-6.604-6.433c-0.363-0.349-0.853-0.567-1.396-0.567-1.104 0-2 0.896-2 2v10c0 1.104 0.896 2 2 2 0.543 0 1.033-0.218 1.396-0.567z"></path>' +
        '          </svg>' +
        '        </button>' +
        '        <button type="button" class="record-rtc-stop" ng-click=ctrl.stop() style="display: none">' +
        '          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24">' +
        '            <path fill="#fff" d="M16 6h-8c-1.1 0-2 0.9-2 2v8c0 1.1 0.9 2 2 2h8c1.1 0 2-0.9 2-2v-8c0-1.1-0.9-2-2-2z"></path>' +
        '          </svg>' +
        '        </button>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '</div>',
      scope: {
        mediaConstraints: '@',
        recordRtc: '@'//,
        //label: '@'
      },
      controller: ['$scope', '$element', '$attrs', '$q', function($scope, $element, $attrs, $q) {
        var ctrl = this;
        var hasContent = false;
        var initializedPromise;

        $scope.ctrl = ctrl;

        ctrl.RecordRTC = RecordRTC;

        ctrl.clearRecordedData = function() {
          return initialize().then(function(o) {
            return o.recorder.clearRecordedData();
          });
        };

        ctrl.getBlob = function() {
          return initialize().then(function(o) {
            return o.recorder.getBlob();
          });
        };

        ctrl.getFromDisk = function() {
          return $q(function(resolve, reject) {
            initialize().then(function(o) {
              o.recorder.getFromDisk(function(dataUrl) {
                resolve(dataUrl);
              });
            });
          });
        };

        ctrl.getDataURL = function() {
          return $q(function(resolve, reject) {
            initialize().then(function(o) {
              o.recorder.getDataUrl(function(dataUrl) {
                resolve(dataUrl);
              });
            });
          });
        };

        ctrl.hide = function() {
          var el = $element[0].getElementsByClassName('record-rtc-backdrop')[0];
          el.style.display = 'none';
        };

        ctrl.onRecordingStopped = function(callback) {
          return initialize().then(function(o) {
            return o.recorder.onRecordingStopped(callback);
          });
        };

        ctrl.playback = function() {
          return $q(function(resolve, reject) {
            if (!hasContent) reject(new Error('Nothing to play'));
            initialize().then(function(o) {
              $scope.elements.record.style.display = 'none';
              $scope.elements.play.style.display = 'none';
              $scope.elements.playMessage.style.display = 'block';
              $scope.elements.recordMessage.style.display = 'none';
              $scope.elements.stop.style.display = 'inline-block';
              return o.player.play();
            });
          });
        };

        ctrl.pauseRecording = function() {
          return initialize().then(function(o) {
            $scope.paused = true;
            return o.recorder.pauseRecording(callback);
          });
        };

        ctrl.resumeRecording = function() {
          return initialize().then(function(o) {
            $scope.paused = false;
            return o.recorder.resumeRecording();
          });
        };

        ctrl.setRecordingDuration = function(millseconds, stoppedCallback) {
          return initialize().then(function(o) {
            return o.recorder.setRecordingDuration();
          });
        }

        ctrl.show = function() {
          var el = $element[0].getElementsByClassName('record-rtc-backdrop')[0];
          el.style.display = 'block';
        };

        ctrl.startRecording = function() {
          return initialize().then(function(o) {
            if (!o.initialized) {
              o.recorder.initRecorder();
              o.initialized = true;
            }
            hasContent = true;
            $scope.elements.record.style.display = 'none';
            $scope.elements.play.style.display = 'none';
            $scope.elements.playMessage.style.display = 'none';
            $scope.elements.recordMessage.style.display = 'block';
            $scope.elements.stop.style.display = 'inline-block';
            o.player.src = o.streamUrl;
            o.player.muted = true;
            return o.recorder.startRecording();
          });
        };

        ctrl.stop = function() {
          if ($scope.elements.playMessage.style.display === 'block') {
            ctrl.stopPlayback();
          } else if ($scope.elements.recordMessage.style.display === 'block') {
            ctrl.stopRecording();
          }
        };

        ctrl.stopPlayback = function() {
          return $q(function(resolve, reject) {
            if (!hasContent) reject(new Error('Nothing to play'));
            initialize().then(function(o) {
              $scope.elements.record.style.display = 'inline-block';
              $scope.elements.play.style.display = 'inline-block';
              $scope.elements.playMessage.style.display = 'none';
              $scope.elements.recordMessage.style.display = 'none';
              $scope.elements.stop.style.display = 'none';
              o.player.pause();
              o.player.currentTime = 0;
            });
          });
        };

        ctrl.stopRecording = function() {
          return $q(function(resolve, reject) {
            if (!$scope.recording) resolve(null);
            initialize().then(function(o) {
              o.recorder.stopRecording(function (videoUrl) {
                $scope.elements.record.style.display = 'inline-block';
                $scope.elements.play.style.display = 'inline-block';
                $scope.elements.playMessage.style.display = 'none';
                $scope.elements.recordMessage.style.display = 'none';
                $scope.elements.stop.style.display = 'none';
                o.player.src = videoUrl;
                o.player.muted = false;
                resolve(videoUrl);
              });
            });
          });
        };

        ctrl.toURL = function() {
          return initialize().then(function(o) {
            return o.recorder.toURL();
          });
        };

        ctrl.save = function() {
          return $q(function(resolve, reject) {
            initialize().then(function(o) {
              ctrl.stopRecording()
                .then(function() {
                  o.recorder.save('recorded-video');
                });
            });
          });
        };

        function initialize() {
          if (!initializedPromise) {
            initializedPromise = recordrtc.getStream()
              .then(function(data) {
                var video = $element[0].getElementsByTagName('video')[0];
                video.src = data.url;
                video.muted = true;

                video.addEventListener('ended', function() {
                  $scope.elements.record.style.display = 'inline-block';
                  $scope.elements.play.style.display = 'inline-block';
                  $scope.elements.playMessage.style.display = 'none';
                  $scope.elements.recordMessage.style.display = 'none';
                  $scope.elements.stop.style.display = 'none';
                });

                return {
                  initialized: false,
                  player: video,
                  recorder: RecordRTC(data.stream, recordrtc.config.recordrtc),
                  streamUrl: data.url
                };
              });
          }
          return initializedPromise;
        }

      }],
      link: function(scope, el, attrs, ctrl) {

        scope.elements = {
          pause: el[0].querySelector('.record-rtc-pause'),
          play: el[0].querySelector('.record-rtc-play'),
          playMessage: el[0].querySelector('.record-rtc-message-playing'),
          record: el[0].querySelector('.record-rtc-record'),
          recordMessage: el[0].querySelector('.record-rtc-message-recording'),
          stop: el[0].querySelector('.record-rtc-stop'),
        };

        scope.isMobile = isMobileDevice;

        scope.label = isMobileDevice ? 'Record Video' : 'Select Video File';

        if (isMobileDevice) {
          el[0].querySelector('.record-rtc-button > button').style.display = 'none';
        }

        el.find('ng-transclude').bind('click', function(e) {
          ctrl.show();
        });
      }
    }
  }]);

  function initializeGetUserMedia($q) {
    if (navigator.mediaDevices === undefined) navigator.mediaDevices = {};
    if (navigator.mediaDevices.getUserMedia === undefined) {
      navigator.mediaDevices.getUserMedia = function (constraints) {

        // attempt to get getUserMedia function
        var getUserMedia = (navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia);

        // if no support then reject
        if (!getUserMedia) {
          return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
        }

        // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
        return $q(function (resolve, reject) {
          getUserMedia.call(navigator, constraints, resolve, reject);
        });

      };
    }
  }
})();
