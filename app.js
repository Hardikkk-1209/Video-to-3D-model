import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.178.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.178.0/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'https://cdn.jsdelivr.net/npm/three@0.178.0/examples/jsm/environments/RoomEnvironment.js';

const viewer = document.getElementById('viewer');
const modelLoading = document.getElementById('modelLoading');
const outputPlaceholder = document.getElementById('outputPlaceholder');
const placeholderTitle = document.getElementById('placeholderTitle');
const placeholderText = document.getElementById('placeholderText');
const modelStatus = document.getElementById('modelStatus');
const processBtn = document.getElementById('processBtn');
const inputBadge = document.getElementById('inputBadge');
const processingScreen = document.getElementById('processingScreen');
const countdownEl = document.getElementById('countdown');
const processingStage = document.getElementById('processingStage');
const processingDetail = document.getElementById('processingDetail');
const progressBar = document.getElementById('progressBar');
const progressPercent = document.getElementById('progressPercent');
const pipelineTime = document.getElementById('pipelineTime');
const buzzList = document.getElementById('buzzList');
const downloadBtn = document.getElementById('downloadBtn');
const uploadZone = document.getElementById('uploadZone');
const modelUrl = 'model1.glb';

// Deliberately simulated: 17 minutes 30 seconds.
const PIPELINE_SECONDS = 17 * 60 + 30;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 5000);
camera.position.set(2.8, 1.6, 3.4);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
viewer.appendChild(renderer.domElement);
renderer.domElement.style.visibility = 'hidden';

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = true;
controls.screenSpacePanning = true;
controls.minDistance = 0.15;
controls.maxDistance = 500;
controls.target.set(0, 0, 0);

const grid = new THREE.GridHelper(10, 20, 0x234250, 0x122832);
grid.material.transparent = true;
grid.material.opacity = 0.45;
scene.add(grid);
scene.add(new THREE.HemisphereLight(0xa9efff, 0x071018, 1.5));
const key = new THREE.DirectionalLight(0xffffff, 2.4);
key.position.set(4, 7, 5);
scene.add(key);
const rim = new THREE.PointLight(0x39ddff, 45, 20);
rim.position.set(-4, 3, -2);
scene.add(rim);

let root = null;
let modelReady = false;
let modelLoadFailed = false;
let processing = false;
let processingCompleted = false;
let countdownTimer = null;
let countdownStartedAt = 0;
let countdownEndAt = 0;

const loader = new GLTFLoader();

function hideLoading() {
  modelLoading.hidden = true;
  modelLoading.style.display = 'none';
}
function showLoading(message) {
  modelLoading.hidden = false;
  modelLoading.style.display = 'grid';
  modelLoading.querySelector('span').textContent = message;
}

loader.load(modelUrl, (gltf) => {
  root = gltf.scene;
  root.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
      if (obj.material) obj.material.needsUpdate = true;
    }
  });
  scene.add(root);
  frameObject(root);
  modelReady = true;
  // The model is intentionally kept hidden until the simulated pipeline ends.
  if (processingCompleted) revealModel();
}, undefined, (error) => {
  console.error('Failed to load model1.glb:', error);
  modelLoadFailed = true;
  if (processingCompleted) showModelError();
});

function frameObject(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxSize = Math.max(size.x, size.y, size.z);
  const fit = maxSize / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)));
  camera.position.copy(center).add(new THREE.Vector3(fit * 0.75, fit * 0.45, fit * 1.05));
  camera.near = Math.max(maxSize / 10000, 0.001);
  camera.far = Math.max(maxSize * 100, 100);
  camera.updateProjectionMatrix();
  controls.target.copy(center);
  controls.minDistance = Math.max(maxSize * 0.05, 0.01);
  controls.maxDistance = Math.max(maxSize * 30, 100);
  controls.update();
  grid.scale.setScalar(Math.max(maxSize / 5, 1));
  grid.position.y = box.min.y;
}

function revealModel() {
  if (!modelReady || !processingCompleted) return;
  hideLoading();
  processingScreen.hidden = true;
  processingScreen.style.display = 'none';
  outputPlaceholder.style.display = 'none';
  renderer.domElement.style.visibility = 'visible';
  modelStatus.textContent = '● VIEW READY';
  modelStatus.classList.add('online');
  downloadBtn.hidden = false;
  inputBadge.textContent = 'COMPLETE';
  processBtn.disabled = false;
  processBtn.classList.remove('processing');
  processBtn.innerHTML = '<span>✓</span> Reconstruction Complete';
}

function showModelError() {
  hideLoading();
  processingScreen.hidden = true;
  outputPlaceholder.style.display = 'grid';
  placeholderTitle.textContent = '3D model could not be loaded';
  placeholderText.textContent = 'Make sure model1.glb is beside index.html.';
  modelStatus.textContent = '● MODEL ERROR';
  modelStatus.classList.remove('online');
}

function formatTime(totalSeconds) {
  const seconds = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

const stages = [
  { at: 0.00, title: 'Initializing pipeline…', detail: 'Preparing image sequence and camera solution', buzz: ['Pipeline queued', 'Camera calibration', 'Feature extraction'] },
  { at: 0.10, title: 'Running photogrammetry pipeline…', detail: 'Analyzing frames and estimating camera poses', buzz: ['Frame extraction', 'Feature matching', 'Pose estimation'] },
  { at: 0.24, title: 'Aligning camera network…', detail: 'Optimizing camera positions and scene geometry', buzz: ['Bundle adjustment', 'Tie points', 'Geometric alignment'] },
  { at: 0.40, title: 'Generating depth maps…', detail: 'Estimating dense depth across the image sequence', buzz: ['Depth inference', 'Dense reconstruction', 'Point cloud build'] },
  { at: 0.57, title: 'Building sparse reconstruction…', detail: 'Refining the scene structure from matched features', buzz: ['Sparse cloud', 'Outlier filtering', 'Surface estimation'] },
  { at: 0.72, title: 'Splatting scene data…', detail: 'Preparing the reconstructed scene representation', buzz: ['Gaussian splatting', 'Geometry refinement', 'View synthesis'] },
  { at: 0.86, title: 'Texturing reconstruction…', detail: 'Projecting source imagery onto the reconstructed surface', buzz: ['Texture projection', 'Atlas generation', 'Material baking'] },
  { at: 0.96, title: 'Finalizing 3D output…', detail: 'Packaging optimized geometry, textures and metadata', buzz: ['Mesh optimization', 'GLB packaging', 'Final validation'] }
];

function updateStage(progress) {
  let current = stages[0];
  for (const stage of stages) if (progress >= stage.at) current = stage;
  processingStage.textContent = current.title;
  processingDetail.textContent = current.detail;
  buzzList.innerHTML = current.buzz.map((item, i) => `<span class="${i === 0 ? 'active' : ''}">${item}</span>`).join('');
}

function finishPipeline() {
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = null;
  processing = false;
  processingCompleted = true;
  countdownEl.textContent = '00:00';
  progressBar.style.width = '100%';
  progressPercent.textContent = '100%';
  pipelineTime.textContent = 'Pipeline complete';
  processingStage.textContent = 'Reconstruction complete ✓';
  processingDetail.textContent = 'Fixed 3D reconstruction is ready to inspect and download.';
  buzzList.innerHTML = '<span class="active">Pipeline complete</span><span>Model validated</span><span>Export ready</span>';
  modelStatus.textContent = modelLoadFailed ? '● MODEL ERROR' : '● FINALIZING';
  if (modelLoadFailed) showModelError();
  else if (modelReady) revealModel();
  else showLoading('Loading final 3D reconstruction…');
}

function startPipeline() {
  if (processing || processingCompleted) return;
  processing = true;
  processingCompleted = false;
  countdownStartedAt = performance.now();
  countdownEndAt = countdownStartedAt + PIPELINE_SECONDS * 1000;
  outputPlaceholder.style.display = 'none';
  processingScreen.hidden = false;
  processingScreen.style.display = 'grid';
  downloadBtn.hidden = true;
  inputBadge.textContent = 'PROCESSING';
  modelStatus.textContent = '● PROCESSING';
  modelStatus.classList.remove('online');
  processBtn.disabled = true;
  processBtn.classList.add('processing');
  processBtn.innerHTML = '<span>◌</span> Pipeline Running…';
  updateStage(0);

  const tick = () => {
    const remaining = Math.max(0, (countdownEndAt - performance.now()) / 1000);
    const elapsed = PIPELINE_SECONDS - remaining;
    const progress = Math.min(1, elapsed / PIPELINE_SECONDS);
    countdownEl.textContent = formatTime(remaining);
    progressBar.style.width = `${progress * 100}%`;
    progressPercent.textContent = `${Math.floor(progress * 100)}%`;
    pipelineTime.textContent = `${formatTime(remaining)} remaining`;
    updateStage(progress);
    if (remaining <= 0) finishPipeline();
  };
  tick();
  countdownTimer = setInterval(tick, 1000);
}

document.addEventListener('video-selected', () => {
  // Uploading a video starts the simulated reconstruction automatically.
  startPipeline();
});

document.getElementById('resetView').addEventListener('click', () => {
  if (root) frameObject(root);
});
document.getElementById('wireToggle').addEventListener('click', (event) => {
  if (!root) return;
  const active = event.currentTarget.classList.toggle('active');
  root.traverse((obj) => {
    if (obj.isMesh && obj.material) obj.material.wireframe = active;
  });
});
document.getElementById('fullscreenBtn').addEventListener('click', () => viewer.requestFullscreen?.());
document.getElementById('themeToggle').addEventListener('click', () => document.documentElement.classList.toggle('light'));
document.querySelectorAll('[data-toggle]').forEach((el) => el.addEventListener('click', () => el.classList.toggle('on')));

processBtn.addEventListener('click', () => {
  if (!processing && !processingCompleted) {
    const input = document.getElementById('videoInput');
    input?.click();
  }
});

function resize() {
  const w = viewer.clientWidth || 800;
  const h = viewer.clientHeight || 600;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}
new ResizeObserver(resize).observe(viewer);
resize();

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
