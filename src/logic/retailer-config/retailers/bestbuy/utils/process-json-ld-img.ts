// Upscales resolution in URL params for consistency
export function processJsonLdImg(url: string) {
  return url.replace(/\/\d+x\d+\//, '/500x500/')
}
