const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

const nameInput = document.getElementById("nameInput");
const saveBtn = document.getElementById("saveBtn");

let labeledDescriptors = [];

// Resize canvas
function resize() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
}

// Load models
async function loadModels() {
  const MODEL_URL = "./models";

  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

  console.log("Models loaded");
}

// Start camera
async function startVideo() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
}

// Save face
saveBtn.onclick = async () => {
  const name = nameInput.value.trim();
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

  localStorage.setItem(
    "faces",
    JSON.stringify(
      labeledDescriptors.map(ld => ({
        label: ld.label,
        descriptors: Array.from(ld.descriptors[0])
      }))
    )
  );

  alert("Face saved!");
};

// Load saved faces
function loadSavedFaces() {
  const data = JSON.parse(localStorage.getItem("faces") || "[]");

  labeledDescriptors = data.map(
    f => new faceapi.LabeledFaceDescriptors(
      f.label,
      [new Float32Array(f.descriptors)]
    )
  );
}

// Face loop
async function recognize() {
  resize();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const detections = await faceapi
    .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptors();

  if (labeledDescriptors.length > 0) {
    const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);

    detections.forEach(det => {
      const match = matcher.findBestMatch(det.descriptor);
      const box = det.detection.box;

      ctx.strokeStyle = "lime";
      ctx.lineWidth = 3;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      ctx.fillStyle = "lime";
      ctx.font = "18px Arial";
      ctx.fillText(match.label, box.x, box.y - 10);
    });
  }

  requestAnimationFrame(recognize);
}

// Init
(async () => {
  await loadModels();
  loadSavedFaces();
  await startVideo();

  video.onloadedmetadata = () => {
    recognize();
  };
})();
