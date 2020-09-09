import {inspect} from 'util'
import {Octokit} from '@octokit/rest'
import * as core from '@actions/core'
import {Voters} from './voters'

export const forIt = '+1'
export const againstIt = '-1'

export interface Reactions {
  [forIt]: number
  [againstIt]: number
  numVoters: number
  voteStartedAt: Date | null
}

type UserReactions = Map<string, number>

// These are summarized reactions which is nice and simple but not useful if we
// need to limit voters in some way to only registered voters.
export async function readReactionsCountsFromSummary(
  octokit: Octokit,
  owner: string,
  repo: string,
  promisedCommentId: Promise<number>
): Promise<Reactions> {
  const commentId = await promisedCommentId
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
    [againstIt]: reactions[againstIt],
    numVoters: 0, // We cannot know here, so just set to 0
    voteStartedAt: null // We cannot know here
  }
}

// These are summarized reactions which is nice and simple but not useful if we
// need to limit voters in some way to only registered voters.
export async function readReactionsCounts(
  octokit: Octokit,
  owner: string,
  repo: string,
  promisedCommentId: Promise<number>
): Promise<UserReactions> {
  const commentId = await promisedCommentId
  const data = await octokit.paginate(octokit.reactions.listForIssueComment, {
    owner,
    repo,
    comment_id: commentId
  })

  core.info(`listForIssueComment data: ${inspect(data)}`)
  const votingData = data.filter(
    next => next.content === forIt || next.content === againstIt
  )

  const result = new Map<string, number>()
  for (const {
    user: {login},
    content
  } of votingData) {
    const vote = reactionToNumber(content)

    const priorTotal = result.get(login) ?? 0
    const total = priorTotal + vote
    result.set(login, total)
  }

  core.info(`readReactionsCounts: ${inspect(result)}`)
  return result
}

export async function weightedVoteTotaling(
  promisedUserReactions: Promise<UserReactions>,
  promisedVoters: Promise<Voters>,
  promisedVoteStartedAt: Promise<Date>
): Promise<Reactions> {
  const userReactions = await promisedUserReactions
  const voters = await promisedVoters

  let forItVotes = 0,
    againstItVotes = 0,
    numVoters = 0
  for (const [user, vote] of userReactions) {
    const voteWeight = voters.get(user) ?? 0

    if (voteWeight > 0 && vote !== 0) {
      numVoters++
    }

    if (vote > 0) {
      forItVotes += vote * voteWeight
    } else if (vote < 0) {
      againstItVotes += -vote * voteWeight
    }
  }
  return {
    [forIt]: forItVotes,
    [againstIt]: againstItVotes,
    numVoters,
    voteStartedAt: await promisedVoteStartedAt
  }
}

function reactionToNumber(reaction: string): number {
  if (reaction === forIt) {
    return 1
  } else if (reaction === againstIt) {
    return -1
  } else {
    return 0
  }
}
