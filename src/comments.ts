import * as core from '@actions/core'

import {Reactions, againstIt, forIt} from './reactions'

import {Config} from './config'
import {GitHub} from '@actions/github/lib/utils'
import {inspect} from 'util'

type Octokit = InstanceType<typeof GitHub>

export class Comment {
  id: number
  createdAt: Date
  body: string

  constructor(commentResponse: CommentResponse) {
    if (commentResponse.body == null) {
      throw new Error('body must be defined')
    }

    this.id = commentResponse.id
    this.createdAt = new Date(commentResponse.created_at)
    this.body = commentResponse.body //this must be defined
  }
}

interface CommentResponse {
  id: number
  created_at: string
  body?: string | undefined
}

export async function findVotingComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  bodyIncludes: string
): Promise<Comment | null> {
  const {data: comments} = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: issueNumber
  })

  const comment = comments.find(next => {
    return next.body?.includes(bodyIncludes)
  })

  if (!comment) {
    core.info(`cannot find comment on issue = ${issueNumber}`)
    return null
  }

  if (isNaN(comment.id)) {
    return Promise.reject(Error('commentId not a number'))
  }

  core.info(`comment: ${inspect(comment)}`)
  return new Comment(comment)
}

export async function findOrCreateVotingComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  bodyIncludes: string,
  createCommentBody: Promise<string>
): Promise<Comment> {
  const comment = await findVotingComment(
    octokit,
    owner,
    repo,
    issueNumber,
    bodyIncludes
  )
  if (!comment) {
    return createVotingComment(
      octokit,
      owner,
      repo,
      issueNumber,
      await createCommentBody
    )
  }

  return comment
}

export async function createVotingComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  body: string
): Promise<Comment> {
  const {data: comment} = await octokit.rest.issues.createComment({
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

export async function updateVotingComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  commentId: Promise<number>,
  body: Promise<string>
): Promise<void> {
  await octokit.rest.issues.updateComment({
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
**${bodyIncludes}** ![Voting](${serverURL}/${owner}/${repo}/workflows/Voting/badge.svg?branch=${ref})
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

export async function closeVotingComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  comment: Comment,
  bodyIncludes: string,
  closedVotingBodyTag: string
): Promise<void> {
  if (bodyIncludes === closedVotingBodyTag) {
    return Promise.reject(
      Error(
        'voting comment identifier and closed comment identifier cannot be equal'
      )
    )
  }

  const closedBody = comment.body.replace(bodyIncludes, closedVotingBodyTag)

  await updateVotingComment(
    octokit,
    owner,
    repo,
    Promise.resolve(comment.id),
    Promise.resolve(closedBody)
  )

  return
}

export async function commentToId(commit: Promise<Comment>): Promise<number> {
  return (await commit).id
}
export async function commentToCreatedAt(
  commit: Promise<Comment>
): Promise<Date> {
  return (await commit).createdAt
}
