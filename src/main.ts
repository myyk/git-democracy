import {inspect} from 'util'
import * as core from '@actions/core'
import * as github from '@actions/github'
import {
  findOrCreateVotingCommentId,
  createVotingCommentBody,
  updateVotingCommentId,
  commentToId,
  commentToCreatedAt,
  Comment,
} from './comments'
import {
  readReactionsCounts,
  weightedVoteTotaling,
  forIt,
  againstIt
} from './reactions'
import {readVotingConfig, Config} from './config'
import {readVoters, Voters} from './voters'
import {evaluateVote} from './voting'
import {GitHub} from '@actions/github/lib/utils'

type Octokit = InstanceType<typeof GitHub>

async function startOrUpdate(
  octokit: Octokit,
  owner: string,
  repo: string,
  serverURL: string,
  comment: Promise<Comment>,
  badgeText: string,
  votersPromise: Promise<Voters>,
  votingConfigPromise: Promise<Config>,
): Promise<void> {
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
      serverURL,
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
}

async function close(): Promise<void> {
}

async function restart(): Promise<void> {
}

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

    switch (github.context.payload.action) {
      case 'opened':
        startOrUpdate(
          octokit,
          owner,
          repo,
          inputs.serverURL,
          comment,
          badgeText,
          votersPromise,
          votingConfigPromise,
        )
        break;
      case 'reopened':
        startOrUpdate(
          octokit,
          owner,
          repo,
          inputs.serverURL,
          comment,
          badgeText,
          votersPromise,
          votingConfigPromise,
        )
        break;
      case 'synchronize':
        restart()
        break;
      case 'closed':
        close()
        break;
    }

    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    core.info(`The event payload: ${payload}`)
  } catch (error) {
    core.setFailed(`error while running action: ${error.message}`)
  }
}

run()
