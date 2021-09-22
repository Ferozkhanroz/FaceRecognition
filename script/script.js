const video = document.getElementById("video");
const retry = document.getElementById("retry");
const photo = document.getElementById("photo");
let numberOfFaces = 2;
let human = false;
let card = false;

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
  human = false;
  card = false;
  setText( `Human: ${human} , Card: ${card}` )
})

let model = null;


async function trackFace() {
  const video = document.getElementById("video");
  const faces = await model.estimateFaces({
      input: video,
      returnTensors: false,
      flipHorizontal: false,
  });
  // console.log(faces);
  faces.forEach(face => {
      const leftEyesDist = Math.sqrt(
          (face.annotations.leftEyeLower1[4][0] - face.annotations.leftEyeUpper1[4][0]) ** 2 +
          (face.annotations.leftEyeLower1[4][1] - face.annotations.leftEyeUpper1[4][1]) ** 2 +
          (face.annotations.leftEyeLower1[4][2] - face.annotations.leftEyeUpper1[4][2]) ** 2
      );
      // console.log(leftEyesDist);

      const rightEyesDist = Math.sqrt(
          (face.annotations.rightEyeLower1[4][0] - face.annotations.rightEyeUpper1[4][0]) ** 2 +
          (face.annotations.rightEyeLower1[4][1] - face.annotations.rightEyeUpper1[4][1]) ** 2 +
          (face.annotations.rightEyeLower1[4][2] - face.annotations.rightEyeUpper1[4][2]) ** 2
      );
      // console.log(rightEyesDist);

      var avg= (leftEyesDist+rightEyesDist)/2;

      if (avg<15) {
        card = true;
      } else if(avg>15) {
        human = true;
      }
      setText( `Human: ${human} , Card: ${card}` )
      
  });
requestAnimationFrame(trackFace);
}


function setText( text ) {
  document.getElementById( "status" ).innerText = text;
}

//Create a canvas overlay to draw detections
video.addEventListener("play", async () => {

model = await faceLandmarksDetection.load(
  faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
);

trackFace();

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
      human = false; 
      card = false;
      setText( `Human: ${human} , Card: ${card}` )
      console.log("no face found");
      var img3 = document.createElement("img");
        img3.src = "./assets/notfound.png";
        img3.id = "not-found";
        var div = document.getElementById("result");
        div.innerHTML = "";
        div.appendChild(img3);
        setTimeout(()=>{
          div.innerHTML = "";
        },3000);
    }
    else if (detections.length == numberOfFaces && human==true && card==true) {
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
        img.src = "./assets/success.png";
        img.id = "success_result";
        var img1 = document.createElement("img");
        img1.src = "./assets/failed.png";
        img1.id = "failed_result";

        //Calculate distance between the detected faces
        const dist = faceapi.euclideanDistance(faceA, faceB);
        // console.log(dist)
        if (dist < 0.6) {
          console.log("Face match successfull.");
          var div = document.getElementById("result");
          div.innerHTML = "";
          div.appendChild(img);
          setTimeout(()=>{
            window.open("https://www.halleyx.com/","_self");
          },1000);
          return 1;
        } else {
          console.log("Faces does not match, Try again!");
          var div = document.getElementById("result");
          div.innerHTML = "";
          div.appendChild(img1);
        }
      } catch (error) { 
        console.log("Oops! Couldn't find any faces (or) Second face is missing. Try again! ")
        var img4 = document.createElement("img");
        img4.src = "./assets/tryagain.png";
        img4.id = "no_result";
        var div = document.getElementById("result");
          div.innerHTML = "";
          div.appendChild(img4);
      }
    } else {
      (err) => console.error(err);
    }
  }
});
