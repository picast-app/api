import { SNS } from 'aws-sdk'

class Client {
  constructor(private readonly sns: SNS, private readonly topicArn: string) {}

  public async send(msg: Record<string, unknown>) {
    await this.sns
      .publish({ Message: JSON.stringify(msg), TopicArn: this.topicArn })
      .promise()
  }
}

export default () => {
  const sns = new SNS()

  return {
    resize: new Client(sns, process.env.RESIZE_SNS),
    parser: new Client(sns, process.env.PARSER_SNS),
  }
}
