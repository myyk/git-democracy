import {inspect} from 'util'
import {Octokit} from '@octokit/rest'
import * as core from '@actions/core'
import {Reactions, forIt, againstIt} from './reactions'
import {Config} from './config'

export class Comment {
  id: number
  createdAt: Date

  constructor(commentResponse: CommentResponse) {
    this.id = commentResponse.id
    this.createdAt = new Date(commentResponse.created_at)
  }
}

interface CommentResponse {
  id: number
  created_at: string
}

export async function findVotingCommentId(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  bodyIncludes: string
): Promise<Comment | null> {
  const {data: comments} = await octokit.issues.listComments({
    owner,
    repo,
    issue_number: issueNumber
  })

  const comment = comments.find(next => {
    return next.body.includes(bodyIncludes)
  })

  if (!comment) {
    core.info(`cannot find comment on issue = ${issueNumber}`)
    return null
  }

  if (isNaN(comment.id)) {
    return Promise.reject(Error('commentId not a number'))
  }

  core.info(`reactions: ${inspect(comment)}`)
  return new Comment(comment)
}

export async function findOrCreateVotingCommentId(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  bodyIncludes: string,
  createCommentBody: Promise<string>
): Promise<Comment> {
  const comment = await findVotingCommentId(
    octokit,
    owner,
    repo,
    issueNumber,
    bodyIncludes
  )
  if (!comment) {
    return createVotingCommentId(
      octokit,
      owner,
      repo,
      issueNumber,
      await createCommentBody
    )
  }

  return comment
}

export async function createVotingCommentId(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  body: string
): Promise<Comment> {
  const {data: comment} = await octokit.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body
  })

  if (isNaN(comment.id)) {
    return Promise.reject(Error('commentId not a number'))
  }
  return new Comment(comment)
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
  let commentBody = `
![${bodyIncludes}](${serverURL}/${owner}/${repo}/workflows/Voting/badge.svg?branch=${ref})
Vote on this comment with 👍 or 👎.

Vote Summary:
  ${votes[forIt]} 👍
  ${votes[againstIt]} 👎

Acceptance Criteria:
  - ${acceptanceCriteria.percentageToApprove}% of weighted votes needs to be to approve
  - ${acceptanceCriteria.minVotersRequired} minimum # of unique voters required
`
  if (acceptanceCriteria.minVotingWindowMinutes !== 0) {
    commentBody += `  - at least ${acceptanceCriteria.minVotingWindowMinutes} minutes of voting`
  }
  return commentBody
}

export async function commentToId(commit: Promise<Comment>): Promise<number> {
  return (await commit).id
}
export async function commentToCreatedAt(
  commit: Promise<Comment>
): Promise<Date> {
  return (await commit).createdAt
}
