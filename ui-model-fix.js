(() => {
  const init = () => {
    const title = document.getElementById('uploadTitle');
    const modelName = document.getElementById('modelName');
    const modelStatus = document.getElementById('modelStatus');
    const processingStage = document.getElementById('processingStage');
    const processingDetail = document.getElementById('processingDetail');
    const placeholderTitle = document.getElementById('placeholderTitle');
    const placeholderText = document.getElementById('placeholderText');

    const sync = () => {
      const name = (title?.textContent || '').toLowerCase();
      const isSecond = /(?:^|[^a-z0-9])video[\s_-]*2(?:[^a-z0-9]|$)/i.test(name) || name.includes('second');
      if (modelName) modelName.textContent = isSecond ? 'Model 2 · Demo reconstruction' : 'Model 1 · Demo reconstruction';
      if (processingStage?.textContent.includes('model')) processingStage.textContent = 'Reconstructing 3D scene…';
      if (processingDetail?.textContent.toLowerCase().includes('.glb')) processingDetail.textContent = 'Optimizing geometry, materials and scene data';
      if (placeholderTitle?.textContent.toLowerCase().includes('.glb')) placeholderTitle.textContent = '3D reconstruction asset unavailable';
      if (placeholderText?.textContent.toLowerCase().includes('.glb')) placeholderText.textContent = 'The selected reconstruction could not be loaded. Check that the required local asset is available and refresh.';
      if (modelStatus?.textContent.includes('MODEL 1') && isSecond && !modelStatus.textContent.includes('READY')) modelStatus.textContent = '● PROCESSING';
    };

    sync();
    const observer = new MutationObserver(sync);
    if (title) observer.observe(title, {childList:true, characterData:true, subtree:true});
    if (modelName) observer.observe(modelName, {childList:true, characterData:true, subtree:true});
    if (processingStage) observer.observe(processingStage, {childList:true, characterData:true, subtree:true});
    if (processingDetail) observer.observe(processingDetail, {childList:true, characterData:true, subtree:true});
    if (placeholderTitle) observer.observe(placeholderTitle, {childList:true, characterData:true, subtree:true});
    if (placeholderText) observer.observe(placeholderText, {childList:true, characterData:true, subtree:true});
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 300));
  else setTimeout(init, 300);
})();