
window.onload = () => {

    // Set constraints for the video stream
    let constraints = {

        video: {

            facingMode: {

                exact: "environment"

            }

        },
        audio: false

    };
    let constraintsFallback = {

        video: {

            facingMode: "environment"

        },

        audio: false

    };

    let track = null;

    // Define constants
    const cameraView = document.querySelector("#camera--view"),
        cameraOutput = document.querySelector("#camera--output"),
        cameraSensor = document.querySelector("#camera--sensor"),
        cameraTrigger = document.querySelector("#camera--trigger");
        speechButton = document.querySelector("#start_button");

    let final_transcript = '';
    let finalKeyWord = '';
    let speechResult = '';
    let recognizing = false;
    let ignore_onend;
    let start_timestamp;
    let recognitionData;
    let recognitionResult = "";

    if ( !('webkitSpeechRecognition' in window) ) {

      upgrade();

    } else {

      start_button.style.display = 'inline-block';
      var recognition = new webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = function() {

        recognizing = true;

      };

      recognition.onerror = function(event) {};

      recognition.onend = function() {

        recognizing = false;

        if (ignore_onend) {

          return;

        }

      };

      recognition.onresult = function(event) {

        let interim_transcript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {

          if (event.results[i].isFinal) {

            final_transcript += event.results[i][0].transcript;

          } else {

            interim_transcript += event.results[i][0].transcript;

          }

        }

        console.log(final_transcript);

      };

    }

    speechButton.addEventListener('click', startButton);
    cameraStart();

    function startButton(event) {

      if (recognizing) {

        recognition.stop();
        console.log("Final speech result: " + final_transcript);
        final_transcript_array = final_transcript.split(' ');
        console.log(final_transcript_array);
        finalKeyword = final_transcript_array[final_transcript_array.length - 1];
        console.log("The final keyword is: " + finalKeyword);

        if (recognitionData) {

            let theClosestLocation = 'center';
            let highestScore = 0;
            console.log(recognitionData.left);

            if (recognitionData.left[finalKeyword] > highestScore) {

                highestScore = recognitionData.left[finalKeyword];
                theClosestLocation = 'left';
                console.log(theClosestLocation);

            }

            if (recognitionData.center[finalKeyword] > highestScore) {

                highestScore = recognitionData.left[finalKeyword];
                theClosestLocation = 'center';
                console.log(theClosestLocation);

            }

            if (recognitionData.right[finalKeyword] > highestScore) {

                highestScore = recognitionData.right[finalKeyword];
                theClosestLocation = 'right';
                console.log(theClosestLocation);

            }

            if (highestScore < 0.4) theClosestLocation = `${finalKeyword} not found`;

            text2speech(theClosestLocation);

        }

        return;

      }

      final_transcript = '';
      recognition.lang = "en-US";
      recognition.start();
      ignore_onend = false;
      start_timestamp = event.timeStamp;

    }

    // Access the device camera and stream to cameraView
    function cameraStart() {

        navigator.mediaDevices
            .getUserMedia(constraints)
            .then(function(stream) {

                track = stream.getTracks()[0];
                cameraView.srcObject = stream;

            })
            .catch(function(error) {

                navigator.mediaDevices
                .getUserMedia(constraintsFallback)
                .then(function(stream) {

                    track = stream.getTracks()[0];
                    cameraView.srcObject = stream;

                })
                .catch(function(error) {

                    console.error("Oops. Something is broken.", error);

                });

            });

    }

    function text2speech (text) {

        var msg = new SpeechSynthesisUtterance();
        msg.text = text;
        speechSynthesis.speak(msg);

        /*switch (where) {

            case 'left':
                msg.text = `${what} is to your left`;
                break;
            case 'right':
                msg.text = `${what} is to your right`;
                break;
            case 'center':
                msg.text = `${what} is straight ahead`;
                break;

        }            
        speechSynthesis.speak(msg);*/

    }

    // Take a picture when cameraTrigger is tapped
    cameraTrigger.onclick = function() {

        let resizedCanvas = document.createElement("canvas");
        let resizedContext = resizedCanvas.getContext("2d");

        let biggerSide = Math.max(cameraView.videoWidth, cameraView.videoHeight);
        let smallerSide = Math.min(cameraView.videoWidth, cameraView.videoHeight);
        let widthHeightRatio = biggerSide / smallerSide;

        let maxSide = biggerSide /  (biggerSide / 480);
        let minSide = maxSide / widthHeightRatio;

        let resizedWidth = cameraView.videoWidth >= cameraView.videoHeight ? maxSide : minSide;
        let resizedHeight = cameraView.videoWidth >= cameraView.videoHeight ? minSide : maxSide;

        resizedCanvas.width = resizedWidth;
        resizedCanvas.height = resizedHeight;

        resizedCanvas.getContext("2d").drawImage(cameraView, 0, 0, resizedWidth, resizedHeight);
        let picture = resizedCanvas.toDataURL("image/jpeg");
        cameraOutput.src = picture;
        cameraOutput.classList.add("taken");

        fetch("http://10.64.5.237:8080/locate", {

            method: 'POST',
            body: picture

        }).then( response => response.json() ).then(data => recognitionData = data);
    };

    // Install ServiceWorker
    if ('serviceWorker' in navigator) {

      console.log('CLIENT: service worker registration in progress.');

      navigator.serviceWorker.register( '/camera-app/part-2/sw.js' , { scope : ' ' } ).then(function() {

        console.log('CLIENT: service worker registration complete.');

      }, function() {

        console.log('CLIENT: service worker registration failure.');

      });

    } else {

      console.log('CLIENT: service worker is not supported.');

    }

}