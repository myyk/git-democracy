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
    return Promise.reject(
      Error(`cannot find comment on issue = ${issueNumber}`)
    )
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

  if (isNaN(commentId)) {
    return Promise.reject(Error('commentId not a number'))
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

  if (isNaN(comment.id)) {
    return Promise.reject(Error('commentId not a number'))
  }
  return comment.id
}

export async function updateVotingCommentId(
  octokit: Octokit,
  owner: string,
  repo: string,
  commentId: Promise<number>,
  body: Promise<string>
): Promise<void> {
  await octokit.issues.updateComment({
    owner,
    repo,
    comment_id: await commentId,
    body: await body
  })
}

export async function createVotingCommentBody(
  serverURL: string,
  owner: string,
  repo: string,
  ref: string,
  bodyIncludes: string,
  votesPromise: Promise<Reactions>,
  acceptanceCriteriaPromise: Promise<Config>
): Promise<string> {
  const votes = await votesPromise
  const acceptanceCriteria = await acceptanceCriteriaPromise
  return `
![${bodyIncludes}](${serverURL}/${owner}/${repo}/workflows/Voting/badge.svg?branch=${ref})
Vote on this comment with 👍 or 👎.

Vote Summary:
  ${votes[forIt]} 👍
  ${votes[againstIt]} 👎

Acceptance Criteria:
  - ${acceptanceCriteria.percentageToApprove}% of weighted votes needs to be to approve
  - ${acceptanceCriteria.minVotersRequired} minimum # of unique voters required
`
  // TODO: add min voting window
}
