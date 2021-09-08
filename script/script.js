const video = document.getElementById("video");
const retry = document.getElementById("retry");
const photo = document.getElementById("photo");
let numberOfFaces = 2;

//Load all the models first before accessing camera
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.faceLandmark68TinyNet.loadFromUri("/models"),
]).then(startVideo);

//Start video streaming from webcam
function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    (stream) => (video.srcObject = stream),
    (err) => console.error(err)
  );
}

retry.addEventListener("click", () =>{
  var div = document.getElementById("result");
    div.innerHTML = "";
  numberOfFaces = 2;
})

//Create a canvas overlay to draw detections
video.addEventListener("play", () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);
  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video)
      .withFaceLandmarks()
      .withFaceDescriptors();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);
    // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    if (detections.length==0) {
      console.log("no face found");
      
    }
    else if (detections.length == numberOfFaces) {
      if (takepicture()) {
        console.log("Capturing ended");
        numberOfFaces = 0;
        return;
      }
    }
  }, 100);

  async function takepicture() {
    var context = canvas.getContext("2d");
    if (video.width && video.height) {
      canvas.width = video.width;
      canvas.height = video.height;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      var data = canvas.toDataURL("image/png");
      photo.setAttribute("src", data);
      // console.log(data)

      //Detect faces from the captured photo
      const faces = await faceapi
        .detectAllFaces(photo)
        .withFaceLandmarks()
        .withFaceDescriptors();
      console.log(faces);
      try {
        const faceA = faces[0].descriptor;
        const faceB = faces[1].descriptor;
        // console.log(faces[0].descriptor,faces[1].descriptor)

        var img = document.createElement("img");
        img.src = "./assets/success.gif";
        img.id = "success_result";
        var img1 = document.createElement("img");
        img1.src = "./assets/failed.gif";
        img1.id = "failed_result";

        //Calculate distance between the detected faces
        const dist = faceapi.euclideanDistance(faceA, faceB);
        // console.log(dist)
        if (dist < 0.6) {
          console.log("Face match successfull.");
          var div = document.getElementById("result");
          div.innerHTML = "";
          div.appendChild(img);
          return 1;
        } else {
          console.log("Faces does not match, Try again!");
          var div = document.getElementById("result");
          div.innerHTML = "";
          div.appendChild(img1);
        }
      } catch (error) {
        console.log("Oops! Couldn't find any faces (or) Second face is missing. Try again! ")
      }
    } else {
      (err) => console.error(err);
    }
  }
});
