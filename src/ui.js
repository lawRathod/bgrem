export function createUI() {
  const imageInput = document.getElementById('imageInput');
  const imageUrlInput = document.getElementById('imageUrlInput');
  const loadUrlButton = document.getElementById('loadUrlButton');
  const modelSelect = document.getElementById('modelSelect');
  const generateButton = document.getElementById('generateButton');
  const statusElement = document.getElementById('status');
  const modelInfo = document.getElementById('modelInfo');
  const sourcePreview = document.getElementById('sourcePreview');
  const maskPreview = document.getElementById('maskPreview');
  const previewSection = document.getElementById('previewSection');
  const sourceCard = document.getElementById('sourceCard');
  const maskCard = document.getElementById('maskCard');
  const downloadMask = document.getElementById('downloadMask');
  const networkLed = document.getElementById('networkLed');
  const benchmarkSection = document.getElementById('benchmarkSection');
  const benchmarkBody = document.getElementById('benchmarkBody');
  const clearBenchmark = document.getElementById('clearBenchmark');

  let generatedMaskURL = '';

  function refreshPreviewVisibility() {
    if (!previewSection) {
      return;
    }

    const hasVisibleSource = sourceCard && !sourceCard.classList.contains('hidden');
    const hasVisibleMask = maskCard && !maskCard.classList.contains('hidden');
    previewSection.classList.toggle('hidden', !hasVisibleSource && !hasVisibleMask);
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

  function setMask(maskBlob) {
    clearMask();
    generatedMaskURL = URL.createObjectURL(maskBlob);
    if (maskPreview) {
      maskPreview.src = generatedMaskURL;
    }
    if (maskCard) {
      maskCard.classList.remove('hidden');
    }
    if (downloadMask) {
      downloadMask.href = generatedMaskURL;
      downloadMask.classList.remove('hidden');
    }
    refreshPreviewVisibility();
  }

  function clearMask() {
    if (generatedMaskURL) {
      URL.revokeObjectURL(generatedMaskURL);
      generatedMaskURL = '';
    }

    if (maskPreview) {
      maskPreview.removeAttribute('src');
    }
    if (maskCard) {
      maskCard.classList.add('hidden');
    }
    if (downloadMask) {
      downloadMask.removeAttribute('href');
      downloadMask.classList.add('hidden');
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
    setMask,
    clearMask,
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
