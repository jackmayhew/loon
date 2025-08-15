/**
 * Hashes a string, number, or boolean using SHA-256.
 * Converts numbers/booleans to strings before hashing.
 * Returns null if the input is null or undefined.
 * @param {string | number | boolean | null | undefined} input The value to hash.
 * @returns {Promise<string | null>} A promise resolving to the SHA-256 hash string (hex) or null.
 */
export async function hashString(input: string | number | boolean | null | undefined): Promise<string | null> {
  // 1. Check for null or undefined input
  if (input === null || input === undefined) {
    return null
  }

  // 2. Convert input to string before encoding
  const inputString = String(input) // Converts numbers/booleans to string representation

  try {
    // 3. Proceed with hashing
    const encoder = new TextEncoder()
    const data = encoder.encode(inputString)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)

    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('')
    return hashHex
  }
  catch (error) {
    console.error('Error generating hash in hashString:', error)
    return null
  }
}
