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
