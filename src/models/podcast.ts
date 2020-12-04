import { ddb } from '~/utils/aws'
import { batch } from '~/utils/array'

const TableName = 'echo_podcasts'

export default class Podcast {
  private constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly feed: string,
    public readonly artwork: string,
    public readonly episodeCount: number
  ) {}

  public static async fetch(id: string): Promise<Podcast | undefined> {
    const { Item } = await ddb.get({ TableName, Key: { id } }).promise()
    return Podcast.fromDB(Item)
  }

  public static async fetchAll(...ids: string[]): Promise<Podcast[]> {
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
      .map(data => Podcast.fromDB(data))
  }

  private static fromDB(data: any) {
    if (!data) return
    return new Podcast(
      data.id,
      data.title,
      data.feed,
      data.artwork,
      data.episodeCount
    )
  }
}
