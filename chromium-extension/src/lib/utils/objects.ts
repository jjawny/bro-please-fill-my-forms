/**
 * GOTCHA:
 *  Chrome storage ignores setting undefined values; must use null or dedicated `remove` fn
 *  Meanwhile the rest of our codebase may treat null/undefined the same (no value)
 *  This means we might fail to clear values from storage
 *  TWO SOLUTIONS:
 *    1. Enforce all types/models/DTOs that go into storage to be nullable NOT nullish (pain, scattered, ez errors-galore)
 *    2. Convert all undefineds to nulls, although costs more compute before every write, keeps the fix close to the problematic code (also writes should be debounced anyway)
 *        Chrome stores object props as KV pairs one-level deep; no need to use recursion here
 */
export function convertUndefinedToNullOneLevelDeep<T extends Record<string, any>>(obj: T): T {
  const result = { ...obj };
  for (const key in result) {
    if (result[key] === undefined) {
      result[key] = null as any;
    }
  }
  return result;
}
