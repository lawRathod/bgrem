export function createUI() {
  const imageInput = document.getElementById('imageInput');
  const imageUrlInput = document.getElementById('imageUrlInput');
  const loadUrlButton = document.getElementById('loadUrlButton');
  const modelSelect = document.getElementById('modelSelect');
  const generateButton = document.getElementById('generateButton');
  const statusElement = document.getElementById('status');
  const modelInfo = document.getElementById('modelInfo');
  const sourcePreview = document.getElementById('sourcePreview');
  const sourceCard = document.getElementById('sourceCard');
  const previewSection = document.getElementById('previewSection');
  const maskResults = document.getElementById('maskResults');
  const networkLed = document.getElementById('networkLed');
  const benchmarkSection = document.getElementById('benchmarkSection');
  const benchmarkBody = document.getElementById('benchmarkBody');
  const clearBenchmark = document.getElementById('clearBenchmark');
  const zoomOverlay = document.getElementById('zoomOverlay');
  const zoomImage = document.getElementById('zoomImage');
  const zoomClose = document.getElementById('zoomClose');

  let generatedMaskURLs = new Map();

  function refreshPreviewVisibility() {
    if (!previewSection) {
      return;
    }

    const hasVisibleSource = sourceCard && !sourceCard.classList.contains('hidden');
    const hasVisibleMasks = maskResults && maskResults.children.length > 0;
    previewSection.classList.toggle('hidden', !hasVisibleSource && !hasVisibleMasks);
  }

  function setStatus(message) {
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  function setGenerateLoading(isLoading) {
    if (!generateButton) {
      return;
    }

    generateButton.disabled = isLoading;
    generateButton.textContent = isLoading ? 'Generating…' : 'Generate';
  }

  function setUrlLoading(isLoading) {
    if (!loadUrlButton) {
      return;
    }

    loadUrlButton.disabled = isLoading;
    loadUrlButton.textContent = isLoading ? '…' : 'Load';
  }

  function setSourcePreview(url) {
    if (sourcePreview) {
      sourcePreview.src = url;
    }
    if (sourceCard) {
      sourceCard.classList.remove('hidden');
    }
    refreshPreviewVisibility();
  }

  function addMaskCard(modelName, maskBlob) {
    if (!maskResults) {
      return;
    }

    const existingCard = maskResults.querySelector(`[data-model="${modelName}"]`);
    if (existingCard) {
      const oldURL = generatedMaskURLs.get(modelName);
      if (oldURL) {
        URL.revokeObjectURL(oldURL);
      }
      existingCard.remove();
    }

    const maskURL = URL.createObjectURL(maskBlob);
    generatedMaskURLs.set(modelName, maskURL);

    const card = document.createElement('div');
    card.className = 'preview';
    card.dataset.model = modelName;

    const tag = document.createElement('span');
    tag.className = 'preview-tag';
    tag.textContent = modelName;

    const img = document.createElement('img');
    img.className = 'preview-img';
    img.alt = `${modelName} mask`;
    img.src = maskURL;

    const dl = document.createElement('a');
    dl.className = 'mask-dl';
    dl.download = `mask-${modelName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
    dl.href = maskURL;
    dl.textContent = '↓';
    dl.title = `Download ${modelName} mask`;

    card.appendChild(tag);
    card.appendChild(img);
    card.appendChild(dl);
    maskResults.appendChild(card);

    refreshPreviewVisibility();
  }

  function clearMasks() {
    for (const [, url] of generatedMaskURLs) {
      URL.revokeObjectURL(url);
    }
    generatedMaskURLs.clear();

    if (maskResults) {
      maskResults.innerHTML = '';
    }
    refreshPreviewVisibility();
  }

  function setNetworkState(state, label) {
    if (!networkLed) {
      return;
    }

    networkLed.dataset.state = state;
    const labelEl = networkLed.querySelector('.net-label');
    if (labelEl) {
      labelEl.textContent = label;
    }
  }

  function setModelOptions(models) {
    if (!modelSelect) {
      return;
    }

    modelSelect.innerHTML = '';
    models.forEach((model) => {
      const option = document.createElement('option');
      option.value = model.value;
      option.textContent = model.label;
      modelSelect.appendChild(option);
    });
  }

  function setModelValue(value) {
    if (!modelSelect) {
      return;
    }

    modelSelect.value = value;
  }

  function setModelInfo(text) {
    if (!modelInfo) {
      return;
    }

    modelInfo.textContent = text;
  }

  function setMode(mode) {
    const btns = document.querySelectorAll('.mode-btn');
    btns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
  }

  function setBenchmarkResults(rows) {
    if (!benchmarkSection || !benchmarkBody) {
      return;
    }

    if (rows.length === 0) {
      benchmarkSection.classList.add('hidden');
      return;
    }

    benchmarkSection.classList.remove('hidden');
    benchmarkBody.innerHTML = '';

    rows.forEach((row) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="cell-name">${row.name}</td>
        <td class="cell-mono">${row.size}</td>
        <td class="cell-mono">${row.loadTime}</td>
        <td class="cell-mono">${row.inferenceTime}</td>
        <td class="cell-mono">${row.totalTime}</td>
        <td class="cell-mono">${row.license}</td>
        <td class="cell-status ${row.status === 'error' ? 'status-error' : ''}">${row.status}</td>
      `;
      benchmarkBody.appendChild(tr);
    });
  }

  function openZoom(src) {
    if (!zoomOverlay || !zoomImage) {
      return;
    }

    zoomImage.src = src;
    zoomOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeZoom() {
    if (!zoomOverlay) {
      return;
    }

    zoomOverlay.classList.remove('active');
    zoomImage.src = '';
    document.body.style.overflow = '';
  }

  previewSection?.addEventListener('click', (e) => {
    const img = e.target.closest('.preview-img');
    if (img) {
      openZoom(img.src);
    }
  });

  zoomClose?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeZoom();
  });

  zoomOverlay?.addEventListener('click', (e) => {
    if (e.target === zoomOverlay) {
      closeZoom();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && zoomOverlay && zoomOverlay.classList.contains('active')) {
      closeZoom();
    }
  });

  return {
    imageInput,
    imageUrlInput,
    loadUrlButton,
    modelSelect,
    generateButton,
    setStatus,
    setGenerateLoading,
    setUrlLoading,
    setSourcePreview,
    addMaskCard,
    clearMasks,
    setNetworkState,
    setModelOptions,
    setModelValue,
    setModelInfo,
    setMode,
    setBenchmarkResults,
    benchmarkSection,
    clearBenchmark,
  };
}
