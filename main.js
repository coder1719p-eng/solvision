const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

const MODEL_URL = "./models";

let faceMatcher = null;
let labeledDescriptors = [];

// LOAD MODELS
async function loadModels() {
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
  console.log("✅ Models loaded");
}

// START CAMERA
async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
}

// FACE DETECTION
video.addEventListener("play", () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const resized = faceapi.resizeResults(detections, {
      width: canvas.width,
      height: canvas.height
    });

    faceapi.draw.drawDetections(canvas, resized);
    faceapi.draw.drawFaceLandmarks(canvas, resized);

    if (faceMatcher) {
      resized.forEach(d => {
        const match = faceMatcher.findBestMatch(d.descriptor);
        ctx.fillStyle = "red";
        ctx.fillText(match.toString(), d.detection.box.x, d.detection.box.y - 5);
      });
    }
  }, 120);
});

// SAVE FACE
document.getElementById("saveBtn").onclick = async () => {
  const name = document.getElementById("nameInput").value.trim();
  if (!name) return alert("Enter name");

  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return alert("No face detected");

  labeledDescriptors.push(
    new faceapi.LabeledFaceDescriptors(name, [detection.descriptor])
  );

  faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
  alert("Saved: " + name);
};

// INIT
(async () => {
  await loadModels();
  await startCamera();
})();
