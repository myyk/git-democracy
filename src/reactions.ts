import {inspect} from 'util'
import {Octokit} from '@octokit/rest'
import * as core from '@actions/core'

export const forIt = '+1'
export const againstIt = '-1'

interface Reactions {
  [forIt]: number
  [againstIt]: number
}

export async function readReactionsCounts(
  octokit: Octokit,
  owner: string,
  repo: string,
  promisedCommentId: Promise<number>
): Promise<Reactions> {
  const commentId = await promisedCommentId
  if (isNaN(commentId)) {
    throw new Error('commentId not a number')
  }

  const {data} = await octokit.issues.getComment({
    owner,
    repo,
    comment_id: commentId
  })

  core.info(`data: ${inspect(data)}`)
  const dataWithReactions: any = data // eslint-disable-line @typescript-eslint/no-explicit-any
  const reactions = dataWithReactions['reactions']
  core.info(`reactions: ${inspect(reactions)}`)
  return {
    [forIt]: reactions[forIt],
    [againstIt]: reactions[againstIt]
  }
}
