/**
 * Simple LRU cache implementation for memoization
 */
class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number = 50) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }
    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    // Remove if exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // Add to end
    this.cache.set(key, value);
    // Evict oldest if over size
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value as K;
      this.cache.delete(firstKey);
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Memoize a function with LRU cache
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: { maxSize?: number; keyFn?: (...args: Parameters<T>) => string } = {}
): T & { cache: { clear: () => void; size: () => number } } {
  const { maxSize = 50, keyFn = (...args) => JSON.stringify(args) } = options;
  const cache = new LRUCache<string, ReturnType<T>>(maxSize);

  const memoized = ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyFn(...args);
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T & { cache: { clear: () => void; size: () => number } };

  memoized.cache = {
    clear: () => cache.clear(),
    size: () => cache.size(),
  };

  return memoized;
}
