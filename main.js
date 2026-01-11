const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

const MODEL_URL = "./models";

let faceMatcher = null;
let labeledDescriptors = [];

// ===================== LOAD MODELS =====================
async function loadModels() {
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

  console.log("✅ Models loaded");
}

// ===================== START CAMERA =====================
async function startVideo() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
}

// ===================== FACE DETECTION LOOP =====================
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
      height: canvas.height,
    });

    faceapi.draw.drawDetections(canvas, resized);
    faceapi.draw.drawFaceLandmarks(canvas, resized);

    if (faceMatcher) {
      resized.forEach(det => {
        const bestMatch = faceMatcher.findBestMatch(det.descriptor);
        const box = det.detection.box;
        ctx.fillStyle = "red";
        ctx.font = "16px Arial";
        ctx.fillText(bestMatch.toString(), box.x, box.y - 5);
      });
    }

  }, 100);
});

// ===================== SAVE FACE =====================
document.getElementById("saveBtn").addEventListener("click", async () => {
  const name = document.getElementById("nameInput").value.trim();
  if (!name) {
    alert("Enter a name first");
    return;
  }

  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    alert("No face detected");
    return;
  }

  labeledDescriptors.push(
    new faceapi.LabeledFaceDescriptors(name, [detection.descriptor])
  );

  faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
  alert("Face saved: " + name);
});

// ===================== INIT =====================
(async () => {
  await loadModels();
  await startVideo();
})();
