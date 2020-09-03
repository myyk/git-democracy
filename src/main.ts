import {inspect} from 'util'
import * as core from '@actions/core'
import * as github from '@actions/github'
import {findOrCreateVotingCommentId} from './comments'
import {readReactionsCounts, forIt, againstIt} from './reactions'
import {readVotingConfig} from './config'
import {Octokit} from '@octokit/rest'

export async function run(): Promise<void> {
  try {
    const inputs = {
      token: core.getInput('token'),
      repository: core.getInput('repository')
    }
    core.debug(`Inputs: ${inspect(inputs)}`)

    // TODO: perhaps we can get this from `github.context.issue`
    const [owner, repo] = inputs.repository.split('/')
    core.debug(`repository: ${owner}/${repo}`)

    const octokit = github.getOctokit(inputs.token, {
      previews: ['squirrel-girl']
    }) as Octokit

    const commentId = findOrCreateVotingCommentId(
      octokit,
      owner,
      repo,
      github.context.issue.number,
      'Current Voting Result',
    )
    core.debug(`github.context.issue.number: ${github.context.issue.number}`)
    core.debug(`commentId: ${await commentId}`)

    // TODO: If can't find the commentID create new voting comment
    // TODO: Read voters file.
    // TODO: User voters in readReactionsCounts.

    const reactionCountsPromise = readReactionsCounts(
      octokit,
      owner,
      repo,
      commentId,
    )

    const votingConfigPromise = readVotingConfig(`./.voting.yml`)

    // TODO: Compute voting result.
    // TODO: Write summary to comment.
    // TODO: Fail if the vote didn't pass.

    const votes = await reactionCountsPromise
    core.debug(`reactionCounts: ${inspect(votes)}`)

    const votingConfig = await votingConfigPromise
    core.debug(`votingConfig: ${inspect(votingConfig)}`)
    core.debug(`forIt: ${votes[forIt]}`)
    core.debug(`againstIt: ${votes[againstIt]}`)

    // TODO: remove, this is just here for now as a placeholder
    core.setOutput('for', votes[forIt])

    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    core.debug(`The event payload: ${payload}`)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
