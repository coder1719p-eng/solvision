const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");
const saveBtn = document.getElementById("saveBtn");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let labeledDescriptors = [];

// ================= LOAD MODELS =================
async function loadModels() {
  const MODEL_URL = "./models";

  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

  startCamera();
}

loadModels();

// ================= START CAMERA =================
function startCamera() {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      video.srcObject = stream;
    })
    .catch(err => {
      alert("Camera permission denied");
      console.error(err);
    });
}

// ================= LOAD SAVED PEOPLE =================
function loadPeople() {
  const data = JSON.parse(localStorage.getItem("people")) || [];
  labeledDescriptors = data.map(p =>
    new faceapi.LabeledFaceDescriptors(
      p.name,
      p.descriptors.map(d => new Float32Array(d))
    )
  );
}

// ================= SAVE FACE =================
saveBtn.addEventListener("click", async () => {
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

  const people = JSON.parse(localStorage.getItem("people")) || [];
  people.push({
    name,
    descriptors: [Array.from(detection.descriptor)]
  });

  localStorage.setItem("people", JSON.stringify(people));
  alert("Face saved!");
  loadPeople();
});

// ================= RECOGNITION LOOP =================
video.addEventListener("play", () => {
  loadPeople();

  setInterval(async () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.5);

    detections.forEach(d => {
      const match = matcher.findBestMatch(d.descriptor);
      const box = d.detection.box;

      ctx.strokeStyle = "lime";
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      ctx.fillStyle = "lime";
      ctx.font = "18px Arial";
      ctx.fillText(match.label, box.x, box.y - 10);
    });
  }, 200);
});
