import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.178.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.178.0/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'https://cdn.jsdelivr.net/npm/three@0.178.0/examples/jsm/environments/RoomEnvironment.js';

const viewer = document.getElementById('viewer');
const modelLoading = document.getElementById('modelLoading');
const outputPlaceholder = document.getElementById('outputPlaceholder');
const modelStatus = document.getElementById('modelStatus');
const uploadZone = document.getElementById('uploadZone');
const videoInput = document.getElementById('videoInput');
const videoPreview = document.getElementById('videoPreview');
const uploadIcon = document.getElementById('uploadIcon');
const uploadTitle = document.getElementById('uploadTitle');
const uploadMeta = document.getElementById('uploadMeta');
const filePill = document.getElementById('filePill');
const processBtn = document.getElementById('processBtn');
const modelUrl = 'model1.glb';

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

const hemi = new THREE.HemisphereLight(0xa9efff, 0x071018, 1.5);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xffffff, 2.4);
key.position.set(4, 7, 5);
scene.add(key);
const rim = new THREE.PointLight(0x39ddff, 45, 20);
rim.position.set(-4, 3, -2);
scene.add(rim);

let root = null;
let modelReady = false;
let processing = false;
let videoObjectUrl = null;

const loader = new GLTFLoader();
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
  if (processing) revealModel();
}, undefined, () => {
  outputPlaceholder.querySelector('strong').textContent = '3D model not found';
  outputPlaceholder.querySelector('span').textContent = 'Place model1.glb in the same folder as index.html and refresh the page.';
  modelStatus.textContent = '● MODEL MISSING';
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
  if (!modelReady) return;
  modelLoading.hidden = true;
  outputPlaceholder.style.display = 'none';
  renderer.domElement.style.visibility = 'visible';
  modelStatus.textContent = '● VIEW READY';
  modelStatus.classList.add('online');
}

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

function openVideoPicker() {
  if (!processing) videoInput.click();
}

uploadZone.addEventListener('click', (event) => {
  if (event.target.closest('video')) return;
  openVideoPicker();
});

uploadZone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    openVideoPicker();
  }
});

uploadZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  uploadZone.classList.add('dragging');
});

uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragging'));

uploadZone.addEventListener('drop', (event) => {
  event.preventDefault();
  uploadZone.classList.remove('dragging');
  const file = [...(event.dataTransfer.files || [])].find((item) => item.type.startsWith('video/'));
  if (file) handleVideo(file);
});

videoInput.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (file) handleVideo(file);
});

function handleVideo(file) {
  if (!file.type.startsWith('video/')) return;
  if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
  videoObjectUrl = URL.createObjectURL(file);
  videoPreview.src = videoObjectUrl;
  videoPreview.hidden = false;
  uploadIcon.style.display = 'none';
  uploadTitle.textContent = file.name;
  uploadMeta.textContent = `${file.type || 'video'} · ${(file.size / 1024 / 1024).toFixed(1)} MB · Preview ready`;
  filePill.textContent = '✓ Video selected · ready for simulation';
  modelStatus.textContent = '● VIDEO READY';
  modelStatus.classList.add('online');
}

processBtn.addEventListener('click', () => {
  if (processing) return;
  if (!videoPreview.src) {
    uploadTitle.textContent = 'Select a video first';
    uploadMeta.textContent = 'Choose an MP4, MOV or WEBM flight video to continue.';
    uploadZone.classList.add('error');
    setTimeout(() => uploadZone.classList.remove('error'), 900);
    return;
  }

  processing = true;
  processBtn.disabled = true;
  processBtn.classList.add('processing');
  processBtn.innerHTML = '<span>◌</span> Processing reconstruction…';
  modelStatus.textContent = '● PROCESSING';
  modelStatus.classList.remove('online');
  outputPlaceholder.style.display = 'none';
  modelLoading.hidden = false;

  setTimeout(() => {
    if (modelReady) revealModel();
    processing = false;
    processBtn.disabled = false;
    processBtn.classList.remove('processing');
    processBtn.innerHTML = '<span>✓</span> 3D Model Ready';
    setTimeout(() => {
      processBtn.innerHTML = '<span>▶</span> Start Processing';
    }, 2200);
  }, 1800);
});
