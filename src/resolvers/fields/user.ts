import User from '~/models/user'
import Podcast from '~/models/podcast'
import * as jwt from '~/auth/jwt'

export const subscriptions: Resolver<
  { user: User },
  { known?: string[] }
> = async ({ user }, { known }) => {
  return {
    added: await Podcast.fetchAll(
      ...(user.subscriptions?.filter(id => !known?.includes(id)) ?? [])
    ),
    removed: known?.filter(id => !user.subscriptions?.includes(id)) ?? [],
  }
}

export const wsAuth: Resolver<User, string> = ({ id }) =>
  jwt.sign({ wsUser: id }, '48h')

export const currentEpisode: Resolver<{ user: User }> = async ({ user }) =>
  user.current && {
    id: {
      podcast: user.current.podcast,
      episode: user.current.episode,
    },
    position: Math.floor(user.current.position),
  }
