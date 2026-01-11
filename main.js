* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  background: #000;
  color: #fff;
  font-family: Arial, sans-serif;
}

.top-bar {
  padding: 10px;
  background: #111;
}

.top-bar input {
  padding: 6px;
  width: 200px;
}

.top-bar button {
  padding: 6px 10px;
  margin-left: 5px;
  cursor: pointer;
}

.video-container {
  position: relative;
  width: 100vw;
  height: calc(100vh - 50px);
}

video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

canvas {
  position: absolute;
  top: 0;
  left: 0;
}
