export const publishDate = ({ datePublished }) =>
  new Date(datePublished * 1000).toISOString()

export const file = ({ enclosureUrl }) => enclosureUrl
