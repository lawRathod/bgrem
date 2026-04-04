export function createModelRegistry() {
  const factories = [];
  const metadatas = new Map();
  let selectedName = null;
  let instance = null;
  let loadTimeMs = null;
  let inferenceTimeMs = null;
  let imageSize = null;

  function registerModel(createModel, modelMeta) {
    const model = createModel();
    factories.push(model);
    metadatas.set(model.name, modelMeta);

    if (!selectedName) {
      selectedName = model.name;
    }
  }

  function getAvailableModels() {
    return factories.map((m) => ({ name: m.name }));
  }

  function getModelMeta(name) {
    return metadatas.get(name) ?? null;
  }

  function selectModel(name) {
    const exists = factories.some((m) => m.name === name);
    if (!exists) {
      throw new Error(`Unknown model: ${name}`);
    }

    if (name !== selectedName) {
      selectedName = name;
      instance = null;
    }
  }

  function getSelectedModel() {
    if (!selectedName) {
      throw new Error('No model selected. Register a model first.');
    }

    return selectedName;
  }

  async function init() {
    const name = getSelectedModel();

    if (instance && instance.name === name) {
      return { loadTimeMs: loadTimeMs ?? 0, cached: true };
    }

    const factory = factories.find((m) => m.name === name);
    if (!factory) {
      throw new Error(`Model factory not found: ${name}`);
    }

    instance = factory;
    const t0 = performance.now();
    await instance.init();
    loadTimeMs = performance.now() - t0;

    return { loadTimeMs, cached: false };
  }

  async function run(imageUrl) {
    if (!instance) {
      throw new Error('Model not initialized. Call init() first.');
    }

    const t0 = performance.now();
    const result = await instance.run(imageUrl);
    inferenceTimeMs = performance.now() - t0;

    return result;
  }

  function setImageSize(width, height) {
    imageSize = { width, height };
  }

  function getMetrics() {
    const name = getSelectedModel();
    const modelMeta = metadatas.get(name);

    return {
      name,
      modelId: modelMeta?.modelId ?? '',
      license: modelMeta?.license ?? '',
      specialty: modelMeta?.specialty ?? '',
      loadTimeMs: loadTimeMs ?? 0,
      inferenceTimeMs: inferenceTimeMs ?? 0,
      imageSize,
    };
  }

  function reset() {
    instance = null;
    loadTimeMs = null;
    inferenceTimeMs = null;
    imageSize = null;
  }

  return {
    registerModel,
    getAvailableModels,
    getModelMeta,
    selectModel,
    getSelectedModel,
    init,
    run,
    setImageSize,
    getMetrics,
    reset,
  };
}
