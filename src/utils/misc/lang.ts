import type { LanguageConfig } from '~/types/retailer/retailer-config.types'

/**
 * Dynamically detects the language of a page by injecting a content script.
 *
 * This function primarily checks the `lang` attribute of the `<html>` element.
 * It can optionally be configured to first check for the language in a specific
 * cookie, falling back to the `lang` attribute if the cookie is not found.
 * The entire operation is wrapped in a try-catch block to handle cases where
 * script injection is not permitted (e.g., on protected browser pages).
 *
 * @param {number} tabId - The ID of the browser tab to inspect.
 * @param {LanguageConfig} [config] - Optional configuration to specify the detection source.
 * @param {'root' | 'cookie'} [config.source] - Where to look for the language. If not specified, defaults to 'root' (the <html> tag).
 * @param {string} [config.key] - The name of the cookie to check if the source is 'cookie'.
 * @returns {Promise<string>} A promise that resolves with the detected language string (e.g., "en-US").
 * Resolves with an empty string if no language is found or if an error occurs.
 */
export async function getPageLanguage(tabId: number, config?: LanguageConfig): Promise<string> {
  const checkType = config?.source || 'root'
  // Change undefined to null, which is serializable
  const key = config?.key || null

  try {
    const injectionResults = await browser.scripting.executeScript({
      target: { tabId },
      func: (type: string, cookieKey?: string | null) => {
        if (type === 'cookie' && cookieKey) {
          const cookieValue = document.cookie
            .split('; ')
            .find(c => c.startsWith(`${cookieKey}=`))
            ?.split('=')[1]
          return cookieValue || document.documentElement.lang
        }
        return document.documentElement.lang
      },
      args: [checkType, key],
    })

    const resultValue = injectionResults?.[0]?.result
    if (typeof resultValue === 'string')
      return resultValue.trim()

    return ''
  }
  catch (e) {
    console.error('Failed to get page language. Config:', config, 'Error:', e)
    return ''
  }
}
