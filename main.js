const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");
const saveBtn = document.getElementById("saveBtn");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let labeledDescriptors = [];

// LOAD MODELS
async function loadModels() {
  const MODEL_URL = "./models";

  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

  startCamera();
}

loadModels();

// START CAMERA
function startCamera() {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => video.srcObject = stream)
    .catch(() => alert("Camera access denied"));
}

// LOAD SAVED PEOPLE
function loadPeople() {
  const data = JSON.parse(localStorage.getItem("people")) || [];

  labeledDescriptors = data.map(p =>
    new faceapi.LabeledFaceDescriptors(
      p.name,
      p.descriptors.map(d => new Float32Array(d))
    )
  );
}

// SAVE FACE
saveBtn.onclick = async () => {
  const name = nameInput.value.trim();
  if (!name) return alert("Enter a name");

  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return alert("No face detected");

  const people = JSON.parse(localStorage.getItem("people")) || [];
  people.push({
    name,
    descriptors: [Array.from(detection.descriptor)]
  });

  localStorage.setItem("people", JSON.stringify(people));
  loadPeople();
  alert("Face saved");
};

// RECOGNITION LOOP
video.addEventListener("play", () => {
  loadPeople();

  setInterval(async () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (!labeledDescriptors.length) return;

    const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.5);

    detections.forEach(d => {
      const box = d.detection.box;
      const match = matcher.findBestMatch(d.descriptor);

      ctx.strokeStyle = "lime";
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x, box.y, box.width, box.height);
      ctx.fillStyle = "lime";
      ctx.fillText(match.label, box.x, box.y - 5);
    });
  }, 200);
});
