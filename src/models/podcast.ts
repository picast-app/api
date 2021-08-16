import * as db from '~/utils/db'
import { PaginationArgs, flatten } from '~/utils/pagination'

export default class Podcast {
  private constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly author: string,
    public readonly feed: string,
    public readonly artwork: string,
    public readonly covers: readonly string[],
    public readonly palette: any,
    public readonly episodeCount: number,
    public readonly description: string,
    public readonly check: string
  ) {}

  public static async fetch(id: string): Promise<Podcast | undefined> {
    const data = await db.podcasts.get(id)
    return Podcast.fromDB(data)
  }

  public static async fetchAll(...ids: string[]): Promise<Podcast[]> {
    if (!ids.length) return []
    const podcasts = await db.podcasts.batchGet(...ids)
    return podcasts.map(data => Podcast.fromDB(data))
  }

  public static async fetchDiff(
    podcasts: { id: string; meta: string; episodes: string }[]
  ) {
    const selected = await db.podcasts
      .batchGet(...podcasts.map(({ id }) => id))
      .select('id', 'metaCheck', 'episodeCheck')

    const metaDiff = podcasts
      .filter(
        ({ id, meta }) =>
          meta && selected.find(v => v.id === id)!.metaCheck !== meta
      )
      .map(({ id }) => id)

    const updatedMeta = metaDiff.length
      ? await Podcast.fetchAll(...metaDiff)
      : []

    return podcasts.map(({ id, meta, episodes }) => ({
      id,
      ...(meta && { podcast: updatedMeta.find(v => v.id === id) }),
      ...(episodes && {
        episodesMatch:
          selected.find(v => v.id === id).episodeCheck === episodes,
      }),
    }))
  }

  public static async episodeDiff(id: string, known: string[]) {
    const { episodes } = await db.parser.get(`${id}#parser`)
    const added = episodes
      .filter(id => !known.includes(id))
      .map(eId => [id, eId] as [string, string])
    const removed = known.filter(id => !episodes.includes(id))

    return {
      podcast: id,
      removed,
      added: await db.episodes.batchGet(...added),
    }
  }

  public static async fetchEpisodes(
    id: string,
    opts: PaginationArgs
  ): Promise<[episodes: any[], pageInfo: Omit<PageInfo, 'episodeCount'>]> {
    const pageOpts = flatten(opts)
    pageOpts.limit ??= Infinity
    const { direction, limit, cursor: cursorId } = pageOpts

    const episodes: any[] = []
    let cursor: { pId: string; eId: string } = cursorId
      ? {
          pId: id,
          eId: cursorId,
        }
      : undefined

    const fetch = async () => {
      const { Items, LastEvaluatedKey } = await db.podcasts.client
        .query({
          TableName: 'echo_episodes',
          KeyConditionExpression: 'pId = :pId ',
          ExpressionAttributeValues: { ':pId': id },
          ScanIndexForward: direction === 'forward',
          Limit: limit + 1 - episodes.length,
          ExclusiveStartKey: cursor,
        })
        .promise()
      episodes.push(...Items)
      cursor = LastEvaluatedKey as any
      if (cursor && episodes.length < limit + 1) await fetch()
    }

    await fetch()

    const pageInfo: PageInfo = {
      hasPreviousPage:
        direction === 'backward'
          ? !!cursorId
          : episodes.splice(limit).length > 0,
      hasNextPage:
        direction === 'forward'
          ? !!cursorId
          : episodes.splice(limit).length > 0,
    }

    return [episodes, pageInfo]
  }

  public static async addSubscriber(podcast: string, user: string) {
    await db.podsubs.update(`podcast#${podcast}`).add({ subscribers: [user] })
  }

  public static async removeSubscriber(podcast: string, user: string) {
    await db.podsubs
      .update(`podcast#${podcast}`)
      .delete({ subscribers: [user] })
  }

  private static fromDB(data: PromiseType<ReturnType<typeof db.podcasts.get>>) {
    if (!data) return
    return new Podcast(
      data.id,
      data.title,
      data.author,
      data.feed,
      data.artwork,
      data.covers,
      data.palette,
      data.episodeCount,
      data.description,
      data.metaCheck
    )
  }
}
