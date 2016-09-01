(function () {
  'use strict';

  angular.module('app')
    .directive('mediaCapture', ['MediaCapture', function () {
      return {
        template: "<div class='btn-group'>" +
          "<button type='button' class='btn btn-default'>Record Video</button>" +
          "<button type='button' class='btn btn-default'>Watch Video</button>" +
          "<button type='button' class='btn btn-default'></button>" +
          "</div>"
      };
    }])
    .factory('MediaCapture', [function () {

      // Older browsers might not implement mediaDevices at all, so we set an empty object first
      if (navigator.mediaDevices === undefined) {
        navigator.mediaDevices = {};
      }

      // Some browsers partially implement mediaDevices. We can't just assign an object
      // with getUserMedia as it would overwrite existing properties.
      // Here, we will just add the getUserMedia property if it's missing.
      if (navigator.mediaDevices.getUserMedia === undefined) {
        navigator.mediaDevices.getUserMedia = promisifiedOldGUM;
      }

      return {
        captureVideo: captureVideo
      };

      function captureVideo() {
        var constraints = { audio: true, video: { width: 1280, height: 720 } };

        navigator.mediaDevices.getUserMedia(constraints)
          .then(function (stream) {
            // RecordRTC API: https://github.com/muaz-khan/WebRTC-Experiment/tree/master/RecordRTC

            var intervalId;
            var recordRTC;
            var recordedUrl;
            var streamUrl = window.URL.createObjectURL(stream);

            // the outer container
            var outer = document.createElement('div');
            outer.style.zIndex = 10000;
            outer.style.position = 'fixed';
            outer.style.top = '0';
            outer.style.bottom = '0';
            outer.style.left = '0';
            outer.style.right = '0';
            outer.style.backgroundColor = 'rgba(0, 0, 0, .75)';
            document.body.appendChild(outer);

            // the inner container
            var inner = document.createElement('div');
            inner.style.width = '480px';
            inner.style.maxWidth = '100%';
            inner.style.height = '270px';
            inner.style.marginTop = '50px';
            inner.style.marginLeft = 'auto';
            inner.style.marginRight = 'auto';
            outer.appendChild(inner);

            // the video player
            var video = document.createElement('video');
            video.style.width = '100%';
            video.style.height = '100%';
            video.style.backgroundColor = 'black';
            inner.appendChild(video);

            // the button controls container
            var controls = document.createElement('div');
            controls.style.width = '480px';
            controls.style.maxWidth = '100%';
            controls.style.marginLeft = 'auto';
            controls.style.marginRight = 'auto';
            controls.style.marginTop = '0';
            controls.style.textAlign = 'center';
            outer.appendChild(controls);

            // the record/stop button to record and stop recording
            var btnRecord = document.createElement('button');
            btnRecord.className = 'btn btn-default';
            btnRecord.innerHTML = 'Record';
            btnRecord.style.width = '34%';
            btnRecord.style.borderRadius = '0';
            btnRecord.addEventListener('click', function () {
              if (recording.style.display === 'none') {

                // update the UI
                btnRecord.innerHTML = 'Stop';
                btnWatch.setAttribute('disabled', 'disabled');
                btnSave.setAttribute('disabled', 'disabled');
                recording.style.display = 'block';

                // mute the video player and set the video stream
                video.src = streamUrl;
                video.muted = true;

                var options = {
                  mimeType: 'video/webm', // or video/mp4 or audio/ogg
                  audioBitsPerSecond: 128000,
                  videoBitsPerSecond: 128000,
                  bitsPerSecond: 128000 // if this line is provided, skip above two
                };
                recordRTC = RecordRTC(stream, options);
                recordRTC.startRecording();

              } else {

                // update variables and the UI
                btnRecord.innerHTML = 'Record';
                btnWatch.removeAttribute('disabled');
                btnSave.removeAttribute('disabled');
                recording.style.display = 'none';

                recordRTC.stopRecording(function (audioVideoWebMURL) {
                  recordedUrl = audioVideoWebMURL;
                  recordRTC.getDataURL(function (dataURL) {
                    console.log(arguments);
                  });
                });
              }
            });
            controls.appendChild(btnRecord);

            // the watch button to watch previously recorded video
            var btnWatch = document.createElement('button');
            btnWatch.className = 'btn btn-default';
            btnWatch.innerHTML = 'Watch';
            btnWatch.style.width = '33%';
            btnWatch.style.borderRadius = '0';
            btnWatch.setAttribute('disabled', 'disabled');
            btnWatch.addEventListener('click', function () {
              if (recordedUrl) {
                video.muted = false;
                video.src = recordedUrl;
              }
            })
            controls.appendChild(btnWatch);

            // the save button
            var btnSave = document.createElement('button');
            btnSave.className = 'btn btn-default';
            btnSave.innerHTML = 'Save';
            btnSave.style.width = '33%';
            btnSave.style.borderRadius = '0';
            btnSave.setAttribute('disabled', 'disabled');
            btnSave.addEventListener('click', function () {
              if (recordedUrl) {
                var blob = recordRTC.getBlob();
                console.log('Form input', blob);
                // TODO - upload video to server
              }
            })
            controls.appendChild(btnSave);

            // a text message that displays during recording
            var recording = document.createElement('div');
            recording.innerHTML = 'Recording';
            recording.style.display = 'none';
            recording.style.position = 'relative';
            recording.style.marginTop = '-75px';
            recording.style.width = '100%';
            recording.style.fontSize = '140%';
            recording.style.color = 'red';
            recording.style.textAlign = 'center';
            recording.style.fontWeight = 'bold';
            controls.appendChild(recording);

            // initialize the video player to display live stream
            video.src = streamUrl;
            video.muted = true;
            video.onloadedmetadata = function (e) {
              video.play();
            };
          })
          .catch(function (err) {
            console.log(err.name + ": " + err.message);
          });
      }

      function promisifiedOldGUM(constraints) {
        // First get ahold of getUserMedia, if present
        var getUserMedia = (navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia);

        // Some browsers just don't implement it - return a rejected promise with an error
        // to keep a consistent interface
        if (!getUserMedia) {
          return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
        }

        // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
        return new Promise(function (resolve, reject) {
          getUserMedia.call(navigator, constraints, resolve, reject);
        });

      }
    }])
})();
