const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Load ONLY tiny face detector (stable)
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('./models')
]).then(startCamera);

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

video.addEventListener("play", () => {
  setInterval(async () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const detections = await faceapi.detectAllFaces(
      video,
      new faceapi.TinyFaceDetectorOptions()
    );

    detections.forEach(d => {
      const box = d.box;

      ctx.strokeStyle = "lime";
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      ctx.fillStyle = "lime";
      ctx.font = "16px Arial";
      ctx.fillText("Face", box.x, box.y - 10);
    });
  }, 200);
});
