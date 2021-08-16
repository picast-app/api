import User from '~/models/user'
import Podcast from '~/models/podcast'
import * as jwt from '~/auth/jwt'

export const subscriptions: Resolver<User, { known?: string[] }> = async (
  { subscriptions },
  { known }
) => {
  return {
    added: await Podcast.fetchAll(
      ...(subscriptions?.filter(id => !known?.includes(id)) ?? [])
    ),
    removed: known?.filter(id => !subscriptions?.includes(id)) ?? [],
  }
}

export const wsAuth: Resolver<User, string> = ({ id }) =>
  jwt.sign({ wsUser: id }, '48h')

export const currentEpisode: Resolver<User> = async ({ current }) => {
  if (!current?.podcast || !current?.episode) return null
  return {
    id: {
      podcast: current.podcast,
      episode: current.episode,
    },
    position: Math.floor(current.position),
  }
}
