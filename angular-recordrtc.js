(function() {
  'use strict';

  var module = angular.module('recordrtc', []);

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
      transclude: true,
      template:
        '<ng-transclude>' +
        '  <button type="button">Open Recorder</button>' +
        '</ng-transclude>' +
        '<div class="record-rtc-backdrop">' +
        '  <div class="record-rtc-outer">' +
        '    <div class="record-rtc-inner record-rtc-widescreen">' +
        '      <video class="record-rtc-video"></video>' +
        '      <div class="record-rtc-messages">' +
        '        <div class="record-rtc-message-playing">Playback</div>' +
        '        <div class="record-rtc-message-recording">Recording</div>' +
        '      </div>' +
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
        '        <button type="button" class="record-rtc-stop" ng-click=ctrl.stopRecording() style="display: none">' +
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
        recordRtc: '@'
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
          var el = $element[0].getElementsByClassName('record-rtc-backdrop');
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
            $scope.elements.stop.style.display = 'inline-block';
            o.player.src = o.streamUrl;
            o.player.muted = true;
            return o.recorder.startRecording();
          });
        };

        ctrl.stopRecording = function() {
          return $q(function(resolve, reject) {
            if (!$scope.recording) resolve(null);
            initialize().then(function(o) {
              o.recorder.stopRecording(function (videoUrl) {
                $scope.elements.record.style.display = 'inline-block';
                $scope.elements.play.style.display = 'inline-block';
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
          record: el[0].querySelector('.record-rtc-record'),
          stop: el[0].querySelector('.record-rtc-stop')
        };

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
