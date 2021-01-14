import {inspect} from 'util'
import {promises as fsPromises, PathLike} from 'fs'
import {load as yamlSafeLoad} from 'js-yaml'
import * as core from '@actions/core'

export class Config {
  percentageToApprove: number
  minVotersRequired: number
  minVotingWindowMinutes: number

  constructor({
    percentageToApprove = 0,
    minVotersRequired = 0,
    minVotingWindowMinutes = 0
  }: {
    percentageToApprove?: number
    minVotersRequired?: number
    minVotingWindowMinutes?: number
  }) {
    this.percentageToApprove = percentageToApprove
    this.minVotersRequired = minVotersRequired
    this.minVotingWindowMinutes = minVotingWindowMinutes
  }
}

export async function readVotingConfig(path: PathLike): Promise<Config> {
  // read voting config
  const fileContents = await fsPromises.readFile(path, 'utf8')
  const configData = yamlSafeLoad(fileContents)

  // validate and sanitize values
  core.info(`voting config: ${inspect(configData)}`)

  if (!(configData instanceof Object)) {
    throw new Error(`config data is not object type`)
  }

  const config = new Config(configData)
  if (!(config instanceof Config)) {
    throw new Error('voting yaml is not instance of Config')
  }

  {
    const percentageToApprove = config.percentageToApprove
    if (percentageToApprove < 0 || percentageToApprove > 100) {
      throw new Error(
        `percentageToApprove=${percentageToApprove} but should be between 0 and 100 inclusively.`
      )
    }
  }

  if (config.minVotersRequired < 0) {
    config.minVotersRequired = 0
  }
  if (config.minVotingWindowMinutes < 0) {
    config.minVotingWindowMinutes = 0
  }

  return config
}
