import axios from 'axios'
import crypto from 'crypto'

export const search = async (_, { query }) => {
  const time = (Date.now() / 1000) | 0

  const headers = {
    'User-Agent': 'test-agent',
    'X-Auth-Key': process.env.PI_API_KEY,
    'X-Auth-Date': time.toString(),
    Authorization: crypto
      .createHash('sha1')
      .update(process.env.PI_API_KEY + process.env.PI_API_SECRET + time, 'utf8')
      .digest('hex'),
  }

  const { data } = await axios.get(
    'https://api.podcastindex.org/api/1.0/search/byterm',
    {
      params: { q: query },
      headers,
    }
  )

  return data.feeds
}
