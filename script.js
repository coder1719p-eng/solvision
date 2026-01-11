const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("./models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("./models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("./models")
]).then(startCamera);

function startCamera() {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => video.srcObject = stream);
}

function loadPeople() {
  const data = JSON.parse(localStorage.getItem("people")) || [];
  return data.map(p =>
    new faceapi.LabeledFaceDescriptors(
      p.name,
      p.descriptors.map(d => new Float32Array(d))
    )
  );
}

async function saveFace(name) {
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
}

document.getElementById("saveBtn").onclick = () => {
  const name = document.getElementById("nameInput").value.trim();
  if (!name) return alert("Enter a name");
  saveFace(name);
};

video.addEventListener("play", async () => {
  setInterval(async () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    const labeled = loadPeople();
    const matcher = new faceapi.FaceMatcher(labeled, 0.5);

    detections.forEach(d => {
      const result = matcher.findBestMatch(d.descriptor);
      const box = d.detection.box;

      ctx.strokeStyle = "lime";
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      ctx.fillStyle = "lime";
      ctx.font = "18px Arial";
      ctx.fillText(result.label, box.x, box.y - 10);
    });
  }, 200);
});
