import {inspect} from 'util'
import * as core from '@actions/core'
import {Config} from './config'
import {Reactions, forIt, againstIt} from './reactions'
import {add} from 'date-fns'

// evaluateVote returns "" on success and the reasons for the vote failing on
// a non-passing vote.
export async function evaluateVote(
  promisedVotingConfig: Promise<Config>,
  promisedVotes: Promise<Reactions>
): Promise<string> {
  const votingConfig = await promisedVotingConfig
  const votes = await promisedVotes

  const percentageForIt =
    (votes[forIt] / (votes[forIt] + votes[againstIt])) * 100

  const failures: string[] = []
  if (percentageForIt < votingConfig.percentageToApprove) {
    failures.push(
      `- Vote did not have the required ${votingConfig.percentageToApprove}% voter approval.`
    )
  }

  if (votes.numVoters < votingConfig.minVotersRequired) {
    failures.push(
      `- Vote has ${votes.numVoters} voters, did not have the required min ${votingConfig.minVotersRequired} voters required to pass a vote.`
    )
  }

  if (votes.voteStartedAt) {
    const votingEarliestEnd = add(votes.voteStartedAt, {
      minutes: votingConfig.minVotingWindowMinutes
    })
    if (votingEarliestEnd > new Date()) {
      failures.push(
        `- Vote requires a minimum voting window of ${votingConfig.minVotingWindowMinutes} minutes before passing a vote.` +
          ` Earliest time to end window is ${votingEarliestEnd}.`
      )
    }
  }

  const failureMessage = failures.join('\n')

  core.info(`voting failure message: ${inspect(failureMessage)}`)

  return failureMessage
}
