import {inspect} from 'util'
import * as core from '@actions/core'
import * as github from '@actions/github'
import {findOrCreateVotingCommentId, createVotingCommentBody} from './comments'
import {readReactionsCounts, forIt, againstIt} from './reactions'
import {readVotingConfig} from './config'
import {readVoters} from './voters'

import {Octokit} from '@octokit/rest'

export async function run(): Promise<void> {
  try {
    const inputs = {
      token: core.getInput('token'),
      repository: core.getInput('repository'),
      issueNumber: core.getInput('issueNumber'),
      serverURL: core.getInput('serverURL')
    }
    core.info(`Inputs: ${inspect(inputs)}`)

    const [owner, repo] = inputs.repository.split('/')
    core.info(`repository: ${owner}/${repo}`)

    const octokit = github.getOctokit(inputs.token, {
      previews: ['squirrel-girl']
    }) as Octokit

    const issueNumber = inputs.issueNumber
      ? Number(inputs.issueNumber)
      : github.context.issue.number
    core.info(`issueNumber: ${issueNumber}`)

    const votingConfigPromise = readVotingConfig(`./.voting.yml`)
    const votersPromise = readVoters(`./.voters.yml`)

    const badgeText = 'Current Voting Result'

    const createCommentBody = createVotingCommentBody(
      inputs.serverURL,
      owner,
      repo,
      github.context.ref,
      badgeText,
      Promise.resolve({
        [forIt]: 0,
        [againstIt]: 0,
        numVoters: 0
      }),
      votingConfigPromise
    )

    // TODO: Get time since voting opened up.
    const commentId = findOrCreateVotingCommentId(
      octokit,
      owner,
      repo,
      issueNumber,
      badgeText,
      createCommentBody
    )
    core.info(`commentId: ${await commentId}`)

    const voters = await votersPromise
    core.info(`voters: ${inspect(voters)}`)

    // TODO: User voters in readReactionsCounts.

    const reactionCountsPromise = readReactionsCounts(
      octokit,
      owner,
      repo,
      commentId
    )

    // TODO: Compute voting result.
    // TODO: Write summary to comment.
    // TODO: Fail if the vote didn't pass.

    const votes = await reactionCountsPromise
    core.info(`reactionCounts: ${inspect(votes)}`)

    const votingConfig = await votingConfigPromise
    core.info(`votingConfig: ${inspect(votingConfig)}`)

    // TODO: remove, this is just here for now as a placeholder
    core.setOutput('for', 1234)

    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    core.info(`The event payload: ${payload}`)
  } catch (error) {
    core.setFailed(`error while running action: ${error.message}`)
  }
}

run()
