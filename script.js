const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let faceMatcher;
let labeledDescriptors = [];

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('./models')
]).then(startCamera);

function startCamera() {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => video.srcObject = stream);
}

async function loadPeople() {
  const data = JSON.parse(localStorage.getItem("people")) || [];
  labeledDescriptors = data.map(p =>
    new faceapi.LabeledFaceDescriptors(
      p.name,
      p.descriptors.map(d => new Float32Array(d))
    )
  );
  faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.5);
}

video.addEventListener("play", async () => {
  await loadPeople();

  setInterval(async () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    detections.forEach(d => {
      const result = faceMatcher
        ? faceMatcher.findBestMatch(d.descriptor)
        : { label: "Unknown" };

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

async function saveFace() {
  const name = document.getElementById("nameInput").value;
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
  alert("Face saved!");
  loadPeople();
}
