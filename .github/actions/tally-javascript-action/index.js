const { inspect } = require("util");
const core = require('@actions/core');
const github = require('@actions/github');
const yaml = require('js-yaml');
const fs = require('fs').promises;

const forIt = '+1';
const againstIt = '-1';

function readReactionsCounts(octokit, repo, commentId) {
  return octokit.issues.getComment({
    owner: repo[0],
    repo: repo[1],
    comment_id: commentId,
  }).then(({ data }) => {
    core.info(`reactions: ${inspect(data.reactions)}`);
    core.info(`+1s '${data.reactions[forIt]}'`);
    return data.reactions;
  }).catch((reason) => {
    core.setFailed(`could not get reactions: ${reason}`);
    return 0;
  });
}

async function readVotingConfig() {
  // read voting config
  return fs
    .readFile('./.voting.yml', 'utf8')
    .then((fileContents) => {
      return yaml.safeLoad(fileContents);
    }).then((config) => {
      core.info(`voting config: ${inspect(config)}`);

      // TODO: validate config
      let percentageToApprove = config["percentage-to-approve"]
      if (percentageToApprove < 0 || percentageToApprove > 100) {
        core.setFailed(`percentage-to-approve=${percentage-to-approve} but should be between 0 and 100 inclusively.`);
      }

      // TODO: handle undefined values as 0s?
      return config
    }).catch((reason) => {
      core.setFailed(`could not read .voting.yml: ${reason}`);
    });
}

async function run() {
  try {
    // read action inputs
    const inputs = {
      token: core.getInput("token"),
      repository: core.getInput("repository"),
      commentId: core.getInput("comment-id"),
    };
    core.debug(`Inputs: ${inspect(inputs)}`);

    const repository = inputs.repository
      ? inputs.repository
      : process.env.GITHUB_REPOSITORY;
    const repo = repository.split("/");
    core.debug(`repository: ${repository}`);

    const octokit = github.getOctokit(
      inputs.token,
      {
        previews: ['squirrel-girl'],
      },
    );

    const reactionCountsPromise = readReactionsCounts(octokit, repo, inputs.commentId)
    const votingConfigPromise = readVotingConfig()

    const reactionCounts = await reactionCountsPromise
    const votingConfig = await votingConfigPromise // TODO: add voting config to action outpus

    core.setOutput("for", reactionCounts[forIt]);
    core.setOutput("against", reactionCounts[againstIt]);

    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    console.log(`The event payload: ${payload}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
