import User from '~/models/user'
import Podcast from '~/models/podcast'
import { wsToken } from '~/auth'

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

export const wsAuth: Resolver<User, string> = ({ id }) => wsToken(id)

export const currentEpisode: Resolver<{ user: User }> = async ({ user }) =>
  user.current && {
    id: {
      podcast: user.current.podcast,
      episode: user.current.episode,
      position: user.current.position,
    },
  }
