import {inspect} from 'util'
import * as core from '@actions/core'
import * as github from '@actions/github'
import {
  findOrCreateVotingCommentId,
  createVotingCommentBody,
  updateVotingCommentId,
  commentToId,
  commentToCreatedAt
} from './comments'
import {
  readReactionsCounts,
  weightedVoteTotaling,
  forIt,
  againstIt
} from './reactions'
import {readVotingConfig} from './config'
import {readVoters} from './voters'
import {evaluateVote} from './voting'

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
    })

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
        numVoters: 0,
        voteStartedAt: null
      }),
      votingConfigPromise
    )

    const comment = findOrCreateVotingCommentId(
      octokit,
      owner,
      repo,
      issueNumber,
      badgeText,
      createCommentBody
    )
    const commentID = commentToId(comment)
    core.info(`commentId: ${await commentID}`)

    const voters = await votersPromise
    core.info(`voters: ${inspect(voters)}`)

    const reactionCountsPromise = readReactionsCounts(
      octokit,
      owner,
      repo,
      commentID
    )

    const votesPromise = weightedVoteTotaling(
      reactionCountsPromise,
      votersPromise,
      commentToCreatedAt(comment)
    )
    const errorMessage = await evaluateVote(votingConfigPromise, votesPromise)

    // Write summary to issue comment.
    await updateVotingCommentId(
      octokit,
      owner,
      repo,
      commentID,
      createVotingCommentBody(
        inputs.serverURL,
        owner,
        repo,
        github.context.ref,
        badgeText,
        votesPromise,
        votingConfigPromise
      )
    )

    if (errorMessage) {
      core.setFailed(`vote failed: ${errorMessage}`)
      return
    }

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
