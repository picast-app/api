export const publishDate = ({ datePublished }) =>
  new Date(datePublished * 1000).toISOString()