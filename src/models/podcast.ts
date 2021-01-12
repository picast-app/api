import { ddb } from '~/utils/aws'
import { batch } from '~/utils/array'
import * as db from '~/utils/db'

const TableName = 'echo_podcasts'

export default class Podcast {
  private constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly feed: string,
    public readonly artwork: string,
    public readonly covers: readonly string[],
    public readonly episodeCount: number,
    public readonly description: string
  ) {}

  public static async fetch(id: string): Promise<Podcast | undefined> {
    const data = await db.podcasts.get(id)
    return Podcast.fromDB(data)
  }

  public static async fetchAll(...ids: string[]): Promise<Podcast[]> {
    if (!ids.length) return []

    const batches = await Promise.all(
      batch(ids, 100).map(ids =>
        ddb
          .batchGet({
            RequestItems: { [TableName]: { Keys: ids.map(id => ({ id })) } },
          })
          .promise()
      )
    )

    return batches
      .flatMap(batch => batch.Responses[TableName])
      .map(data => Podcast.fromDB(data as any))
  }

  private static fromDB(data: PromiseType<ReturnType<typeof db.podcasts.get>>) {
    if (!data) return
    return new Podcast(
      data.id,
      data.title,
      data.feed,
      data.artwork,
      data.art,
      data.episodeCount,
      data.description
    )
  }
}
