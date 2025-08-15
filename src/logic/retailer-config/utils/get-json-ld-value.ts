/**
 * Safely retrieves a nested value from an object using a dot and bracket notation path.
 * Handles basic array indexing like 'prop.arrayKey[0].nested'.
 * Does NOT handle optional chaining ('?.') within the path string itself.
 * Returns undefined if the path doesn't exist or is invalid.
 *
 * @template T The expected type of the returned value. Defaults to `any`.
 * @param {object | null | undefined} data The object to traverse.
 * @param {string | null | undefined} path The dot/bracket notation path string (e.g., 'user.addresses[0].city').
 * @returns {T | undefined} The value found at the path, or undefined.
 */
export function getJsonLdValue<T = any>(data: any, path: string | null | undefined): T | undefined {
  // Early exit for invalid inputs
  if (data == null || typeof path !== 'string' || path === '') {
    // Return data if path is empty and data is object, else undefined
    return (path === '' && typeof data === 'object') ? data as T : undefined
  }

  const pathParts = path.split('.')
  // Regex to capture key and index from parts like "arrayKey[0]"
  const arrayIndexRegex = /^(.*)\[(\d+)\]$/
  let current: any = data // Start traversal from the root object

  for (const part of pathParts) {
    // If at any point traversal leads to null/undefined, stop and return undefined
    if (current == null) {
      return undefined
    }

    const match = part.match(arrayIndexRegex)

    if (match) {
      // Matched 'key[index]' format
      const key = match[1] // The part before brackets
      const index = Number.parseInt(match[2], 10) // The numeric index

      // Access the array (key) first, then the element at index safely.
      // Optional chaining is applied *here* during access, not parsed from the path string.
      current = current[key]?.[index]
    }
    else {
      // Regular object property access.
      // Safety check happens via the `if (current == null)` at the loop start.
      current = current[part]
    }
  }
  // Ensure the final result is explicitly undefined if it ended up as null
  return current ?? undefined
}
