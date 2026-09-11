// Native video picker and drag/drop layer.
(() => {
  const zone = document.getElementById('uploadZone');
  const input = document.getElementById('videoInput');
  const browse = document.getElementById('browseVideoBtn');
  const preview = document.getElementById('videoPreview');
  const icon = document.getElementById('uploadIcon');
  const title = document.getElementById('uploadTitle');
  const meta = document.getElementById('uploadMeta');
  const pill = document.getElementById('filePill');
  const status = document.getElementById('modelStatus');

  if (!zone || !input || !browse || !preview) return;

  let objectUrl = null;

  const isVideo = (file) => file && (
    (file.type && file.type.startsWith('video/')) ||
    /\.(mp4|mov|m4v|webm|avi|mkv)$/i.test(file.name)
  );

  function showVideo(file) {
    if (!isVideo(file)) {
      title.textContent = 'Unsupported file';
      meta.textContent = 'Please choose an MP4, MOV, M4V or WEBM video.';
      return;
    }

    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(file);
    preview.src = objectUrl;
    preview.hidden = false;
    preview.style.display = 'block';
    preview.load();
    icon.style.display = 'none';
    title.textContent = file.name;
    meta.textContent = `${file.type || 'video'} · ${(file.size / 1024 / 1024).toFixed(1)} MB · Preview ready`;
    pill.textContent = '✓ Video selected · pipeline starting';
    status.textContent = '● QUEUED';
    status.classList.add('online');

    document.dispatchEvent(new CustomEvent('video-selected', { detail: { file } }));
  }

  browse.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    input.click();
  });

  zone.addEventListener('click', (event) => {
    if (event.target.closest('video') || event.target.closest('#browseVideoBtn')) return;
    input.click();
  });

  zone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      input.click();
    }
  });

  zone.addEventListener('dragover', (event) => {
    event.preventDefault();
    zone.classList.add('dragging');
  });

  zone.addEventListener('dragleave', () => zone.classList.remove('dragging'));

  zone.addEventListener('drop', (event) => {
    event.preventDefault();
    zone.classList.remove('dragging');
    const file = [...(event.dataTransfer.files || [])].find(isVideo);
    if (file) showVideo(file);
  });

  input.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (file) showVideo(file);
    input.value = '';
  });
})();
