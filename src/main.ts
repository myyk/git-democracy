import {inspect} from 'util'
import * as core from '@actions/core'
import * as github from '@actions/github'
import {findOrCreateVotingCommentId, createVotingCommentBody} from './comments'
import {readReactionsCounts, forIt, againstIt} from './reactions'
import {readVotingConfig} from './config'
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

    // TODO: perhaps we can get this from `github.context.issue`
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

    const badgeText = 'Current Voting Result'

    const createCommentBody = createVotingCommentBody(
      'https://github.com', // TODO: have this passed in as an input with default
      owner,
      repo,
      github.context.ref,
      badgeText,
      Promise.resolve({
        [forIt]: 0,
        [againstIt]: 0
      }),
      votingConfigPromise
    )

    const commentId = findOrCreateVotingCommentId(
      octokit,
      owner,
      repo,
      issueNumber,
      badgeText,
      createCommentBody
    )
    core.info(`commentId: ${await commentId}`)

    // TODO: Read voters file.
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
    core.info(`forIt: ${votes[forIt]}`)
    core.info(`againstIt: ${votes[againstIt]}`)

    // TODO: remove, this is just here for now as a placeholder
    core.setOutput('for', votes[forIt])

    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    core.info(`The event payload: ${payload}`)
  } catch (error) {
    core.setFailed(`error while running action: ${error.message}`)
  }
}

run()
