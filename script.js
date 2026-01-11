const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

// Fullscreen canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let labeledDescriptors = [];

/* =========================
   LOAD FACE-API MODELS
========================= */
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("./models"),
  faceapi.nets.faceLandmark68TinyNet.loadFromUri("./models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("./models")
]).then(startCamera).catch(err => {
  console.error("Model loading error:", err);
});

/* =========================
   START CAMERA
========================= */
function startCamera() {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      video.srcObject = stream;
    })
    .catch(err => {
      alert("Camera access denied");
      console.error(err);
    });
}

/* =========================
   LOAD SAVED PEOPLE
========================= */
function loadPeople() {
  const data = JSON.parse(localStorage.getItem("people")) || [];

  labeledDescriptors = data.map(p =>
    new faceapi.LabeledFaceDescriptors(
      p.name,
      p.descriptors.map(d => new Float32Array(d))
    )
  );
}

/* =========================
   SAVE FACE WITH NAME
========================= */
async function saveFace() {
  const nameInput = document.getElementById("nameInput");
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

  const people = JSON.parse(localStorage.getItem("people")) || [];

  people.push({
    name: name,
    descriptors: [Array.from(detection.descriptor)]
  });

  localStorage.setItem("people", JSON.stringify(people));

  alert("Face saved successfully!");
  nameInput.value = "";

  loadPeople();
}

/* =========================
   FACE DETECTION + RECOGNITION
========================= */
video.addEventListener("play", async () => {
  loadPeople();

  setInterval(async () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!video.videoWidth) return;

    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    const resized = faceapi.resizeResults(detections, {
      width: canvas.width,
      height: canvas.height
    });

    const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.5);

    resized.forEach(d => {
      const result = matcher.findBestMatch(d.descriptor);
      const box = d.detection.box;

      ctx.strokeStyle = "lime";
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      ctx.fillStyle = "lime";
      ctx.font = "18px Arial";
      ctx.fillText(result.label, box.x, box.y - 10);
    });
  }, 150);
});
