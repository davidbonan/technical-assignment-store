export const weakMapGet = <K extends object, V>(map: WeakMap<K, V>, key: K, defaultValue: V) => {
  const obj = map.get(key);
  if (obj !== undefined) {
    return obj;
  }
  map.set(key, defaultValue);
  return defaultValue;
};
