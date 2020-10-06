import {inspect} from 'util'
import * as core from '@actions/core'
import * as github from '@actions/github'
import {
  findVotingComment,
  findOrCreateVotingComment,
  createVotingCommentBody,
  updateVotingComment,
  commentToId,
  commentToCreatedAt,
  closeVotingComment
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
  issueNumber: number,
  badgeText: string,
  votersPromise: Promise<Voters>,
  votingConfigPromise: Promise<Config>
): Promise<void> {
  const createCommentBody = createVotingCommentBody(
    serverURL,
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

  const comment = findOrCreateVotingComment(
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
  await updateVotingComment(
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

async function close(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  badgeText: string,
  closedVotingBodyTag: string
): Promise<void> {
  const comment = await findVotingComment(
    octokit,
    owner,
    repo,
    issueNumber,
    badgeText
  )
  if (!comment) {
    core.warning(
      `no vote started, this may be because something is misconfigured or the action was recently added`
    )
    return
  }

  await closeVotingComment(
    octokit,
    owner,
    repo,
    comment,
    badgeText,
    closedVotingBodyTag
  )
}

async function restart(): Promise<void> {}

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

    switch (github.context.payload.action) {
      case 'opened':
        startOrUpdate(
          octokit,
          owner,
          repo,
          inputs.serverURL,
          issueNumber,
          badgeText,
          votersPromise,
          votingConfigPromise
        )
        break
      case 'reopened':
        startOrUpdate(
          octokit,
          owner,
          repo,
          inputs.serverURL,
          issueNumber,
          badgeText,
          votersPromise,
          votingConfigPromise
        )
        break
      case 'synchronize':
        restart()
        break
      case 'closed':
        close(octokit, owner, repo, issueNumber, badgeText, 'Voting is closed')
        break
    }

    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    core.info(`The event payload: ${payload}`)
  } catch (error) {
    core.setFailed(`error while running action: ${error.message}`)
  }
}

run()
