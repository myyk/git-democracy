import {inspect} from 'util'
import {Octokit} from '@octokit/rest'
import * as core from '@actions/core'

export async function findVotingCommentId(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  bodyIncludes: string
): Promise<number | null> {
  const {data: comments} = await octokit.issues.listComments({
    owner,
    repo,
    issue_number: issueNumber
  })

  const comment = comments.find(next => {
    return next.body.includes(bodyIncludes)
  })

  if (!comment) {
    throw new Error(`cannot find comment on issue = ${issueNumber}`)
  }

  core.info(`reactions: ${inspect(comment)}`)
  return comment.id
}

export async function findOrCreateVotingCommentId(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  bodyIncludes: string
): Promise<number> {
  const commentId = await findVotingCommentId(
    octokit,
    owner,
    repo,
    issueNumber,
    bodyIncludes
  )
  if (!commentId) {
    return createVotingCommentId()
  }

  return commentId
}

export async function createVotingCommentId(): Promise<number> {
  throw new Error('not implemented yet')
}
