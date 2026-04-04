export function createModelRegistry() {
  const factories = [];
  let selectedName = null;
  let instance = null;

  function registerModel(createModel) {
    const model = createModel();
    factories.push(model);

    if (!selectedName) {
      selectedName = model.name;
    }
  }

  function getAvailableModels() {
    return factories.map((m) => ({ name: m.name }));
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
      return;
    }

    const factory = factories.find((m) => m.name === name);
    if (!factory) {
      throw new Error(`Model factory not found: ${name}`);
    }

    instance = factory;
    await instance.init();
  }

  async function run(imageUrl) {
    if (!instance) {
      throw new Error('Model not initialized. Call init() first.');
    }

    return instance.run(imageUrl);
  }

  return {
    registerModel,
    getAvailableModels,
    selectModel,
    getSelectedModel,
    init,
    run,
  };
}
