// LLM processes raw product data, and returns this proccessed object
export interface ProcessedScrapedProduct {
  categoryKeywords: string[]
  productEmbeddingText: string
  keyAttributes: Record<string, any>
}
