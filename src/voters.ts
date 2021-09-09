import * as core from '@actions/core'

import {PathLike, promises as fsPromises} from 'fs'

import {inspect} from 'util'
import {load as yamlSafeLoad} from 'js-yaml'

export class Voters extends Map<string, number> {
  constructor(obj?: object) {
    super()
    if (obj) {
      for (const entry of Object.entries(obj)) {
        const [key, val] = entry
        if (typeof val === 'number') {
          this.set(key, val)
        }
      }
    }
  }
}

export async function readVoters(path: PathLike): Promise<Voters> {
  const fileContents = await fsPromises.readFile(path, 'utf8')
  const data = yamlSafeLoad(fileContents)

  // validate and sanitize values
  core.info(`voters: ${inspect(data)}`)

  if (!(data instanceof Object)) {
    throw new Error(`voters data is not object type`)
  }

  return new Voters(data)
}
