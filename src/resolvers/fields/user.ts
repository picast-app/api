import User from '~/models/user'
import Podcast from '~/models/podcast'

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
