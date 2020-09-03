import {inspect} from 'util'
import {Octokit} from '@octokit/rest'
import * as core from '@actions/core'
import {Reactions, forIt, againstIt} from './reactions'
import {Config} from './config'

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
  bodyIncludes: string,
  createCommentBody: Promise<string>
): Promise<number> {
  const commentId = await findVotingCommentId(
    octokit,
    owner,
    repo,
    issueNumber,
    bodyIncludes
  )
  if (!commentId) {
    return createVotingCommentId(
      octokit,
      owner,
      repo,
      issueNumber,
      await createCommentBody
    )
  }

  return commentId
}

export async function createVotingCommentId(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  body: string
): Promise<number> {
  const {data: comment} = await octokit.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body
  })

  return comment.id
}

export async function createVotingCommentBody(
  serverURL: string,
  owner: string,
  repo: string,
  ref: string,
  bodyIncludes: string,
  votesPromise: Promise<Reactions>,
  acceptanceCriteria: Promise<Config>
): Promise<string> {
  const votes = await votesPromise
  return `
![${bodyIncludes}](${serverURL}/${owner}/${repo}/workflows/Voting/badge.svg?branch=${ref})
Vote on this comment with 👍 or 👎.

Vote Summary:
  ${votes[forIt]} 👍
  ${votes[againstIt]} 👎

Acceptance Criteria:
  ${await acceptanceCriteria}
`
}
