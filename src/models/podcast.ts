import * as db from '~/utils/db'
import { PaginationArgs, flatten } from '~/utils/pagination'
import { ddb } from '~/utils/aws'

export default class Podcast {
  private constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly feed: string,
    public readonly artwork: string,
    public readonly covers: readonly string[],
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

  public static async fetchDiff(podcasts: { id: string; check: string }[]) {
    const items = await db.podcasts
      .batchGet(...podcasts.map(({ id }) => id))
      .select('id', 'check')

    return Podcast.fetchAll(
      ...items
        .filter(v => podcasts.find(({ id }) => id === v.id).check !== v.check)
        .map(({ id }) => id)
    )
  }

  public static async fetchEpisodes(
    id: string,
    opts: PaginationArgs
  ): Promise<[episodes: any[], pageInfo: Omit<PageInfo, 'episodeCount'>]> {
    const pageOpts = flatten(opts)
    const { direction, limit, cursor: cursorId } = pageOpts

    const episodes: any[] = []
    let cursor: { pId: string; eId: string } = cursorId
      ? {
          pId: id,
          eId: cursorId,
        }
      : undefined

    const fetch = async () => {
      const { Items, LastEvaluatedKey } = await ddb
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

  private static fromDB(data: PromiseType<ReturnType<typeof db.podcasts.get>>) {
    if (!data) return
    return new Podcast(
      data.id,
      data.title,
      data.feed,
      data.artwork,
      data.covers,
      data.episodeCount,
      data.description,
      (data as any).check
    )
  }
}
