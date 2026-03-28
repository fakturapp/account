'use client'

interface HighlightTextProps {
  text: string
  query: string | null
}

export function HighlightText({ text, query }: HighlightTextProps) {
  if (!query || !text) return <>{text}</>

  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const index = lowerText.indexOf(lowerQuery)

  if (index === -1) return <>{text}</>

  const before = text.slice(0, index)
  const match = text.slice(index, index + query.length)
  const after = text.slice(index + query.length)

  return (
    <>
      {before}
      <mark className="highlight-fade bg-yellow-400/40 text-inherit rounded-sm px-0.5">{match}</mark>
      {after}
    </>
  )
}
