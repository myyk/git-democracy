import * as core from '@actions/core'
import * as github from '@actions/github'

import {Config, readVotingConfig} from './config'
import {Voters, readVoters} from './voters'
import {
  againstIt,
  forIt,
  readReactionsCounts,
  weightedVoteTotaling
} from './reactions'
import {
  closeVotingComment,
  commentToId,
  createVotingCommentBody,
  findOrRecreateVotingComment,
  findVotingComment,
  updateVotingComment
} from './comments'

import {GitHub} from '@actions/github/lib/utils'
import {evaluateVote} from './voting'
import {inspect} from 'util'

type Octokit = InstanceType<typeof GitHub>

async function startOrUpdateHelper(
  octokit: Octokit,
  owner: string,
  repo: string,
  serverURL: string,
  issueNumber: number,
  badgeText: string,
  votersPromise: Promise<Voters>,
  votingConfigPromise: Promise<Config>
): Promise<string | Error | null> {
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

  const comment = findOrRecreateVotingComment(
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
    issueNumber
  )

  // TODO: could consolidate this call as it's used elsewhere
  const pullRequest = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: issueNumber
  })

  const updateTime = pullRequest.data?.head?.repo?.pushed_at
  if (!updateTime) {
    return Promise.reject(new Error("There's no head commit uploaded"))
  }

  const votesPromise = weightedVoteTotaling(
    reactionCountsPromise,
    votersPromise,
    Promise.resolve(new Date(updateTime))
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
    return errorMessage
  }
  return null
}

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
  const errorMessage = await startOrUpdateHelper(
    octokit,
    owner,
    repo,
    serverURL,
    issueNumber,
    badgeText,
    votersPromise,
    votingConfigPromise
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

export async function run(): Promise<void> {
  try {
    const inputs = {
      token: core.getInput('token'),
      repository: core.getInput('repository'),
      payloadAction: core.getInput('payloadAction')
        ? core.getInput('payloadAction')
        : github.context.payload.action,
      configPath: core.getInput('configPath'),
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

    const votingConfigPromise = readVotingConfig(
      `${inputs.configPath}/.voting.yml`
    )
    const votersPromise = readVoters(`${inputs.configPath}/.voters.yml`)

    const badgeText = 'Current Voting Result'

    switch (inputs.payloadAction) {
      case 'opened':
      case 'reopened':
      case 'synchronize':
        await startOrUpdate(
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
      case 'closed':
        await close(
          octokit,
          owner,
          repo,
          issueNumber,
          badgeText,
          'Voting is closed'
        )
        break
    }

    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    core.info(`The event payload: ${payload}`)
  } catch (error) {
    core.setFailed(`error while running action: ${error}`)
  }
}

try {
  run()
} catch (error: any) {
  core.error(error.stack)
  core.setFailed(`error while running action: ${error}`)
}
