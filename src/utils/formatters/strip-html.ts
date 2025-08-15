/**
 * Strips HTML tags from a string using the safe DOMParser API, returning plain text.
 * If the input is not a string, it is returned unchanged. This function uses
- * TypeScript overloads to ensure type safety.
 *
 * @template T
 * @param {T} html - The input value. If it's a string, HTML tags will be stripped.
 * @returns {T extends string ? string : T} The plain text content if the input was a string, otherwise the original input.
 */

// Overload for when a string is passed
export function stripHtml(html: string): string

// Overload for any other type (input is returned as is)
// If T is not string, T is returned.
export function stripHtml<T>(html: T): T extends string ? string : T

// Implementation
export function stripHtml(html: unknown): unknown {
  if (typeof html !== 'string') {
    return html
  }
  // If html is a string, the function will return a string from this point.
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return doc.body?.textContent || doc.documentElement?.textContent || ''
  }
  catch (e) {
    console.error('Error stripping HTML:', e)
    return html
  }
}
