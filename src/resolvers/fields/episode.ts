export const publishDate = ({ datePublished, published }) =>
  new Date((published ?? datePublished) * 1000).toISOString()

export const file = ({ enclosureUrl, url }) => url ?? enclosureUrl

export const id = ({ eId }) => eId
