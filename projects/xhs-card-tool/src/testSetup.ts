const createLocalStorageShim = (): Storage => {
  const backing = new Map<string, string>();

  return {
    get length() {
      return backing.size;
    },
    clear() {
      backing.clear();
    },
    getItem(key) {
      return backing.get(key) ?? null;
    },
    setItem(key, value) {
      backing.set(key, String(value));
    },
    removeItem(key) {
      backing.delete(key);
    },
    key(index) {
      return Array.from(backing.keys())[index] ?? null;
    },
  };
};

if (typeof globalThis.localStorage === "undefined") {
  Object.defineProperty(globalThis, "localStorage", {
    value: createLocalStorageShim(),
    configurable: true,
    writable: true,
  });
}

// jsdom never decodes images, so Image.onload would hang forever; give it a
// deterministic async load with a fixed intrinsic size for fileToDataUrl.
class FakeImage {
  width = 800;
  height = 600;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  set src(_value: string) {
    queueMicrotask(() => this.onload?.());
  }
}

if (typeof globalThis.window !== "undefined") {
  Object.defineProperty(globalThis.window, "Image", {
    value: FakeImage,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, "Image", {
    value: FakeImage,
    configurable: true,
    writable: true,
  });

  HTMLCanvasElement.prototype.getContext = function getContext() {
    return { drawImage: () => undefined } as unknown as CanvasRenderingContext2D;
  } as unknown as typeof HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.toDataURL = () => "data:image/jpeg;base64,dGVzdA==";
}
