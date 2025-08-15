interface Term {
  term_id: string
  name: string
  similarity: number
}

export type PossibleTerms = Term[]

export type MatchingTerms = Term[]
