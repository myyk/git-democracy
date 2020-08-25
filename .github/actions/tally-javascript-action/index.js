const { inspect } = require("util");
const core = require('@actions/core');
const github = require('@actions/github');

const forIt = '+1';
const againstIt = '-1';

async function readReactionsCounts(octokit, repo, commentId, reactionsSet) {
  let reactions = [...reactionsSet];

  let response = await octokit.issues.getComment({
    owner: repo[0],
    repo: repo[1],
    comment_id: commentId,
    mediaType: {
      previews: [
        'squirrel-girl'
      ]
    },
  });

  core.info(`issues.getComment '${inspect(response)}' response.`);
  core.info(`response.data.reactions '${inspect(response.data.reactions)}'`);
  core.info(`+1s '${response.data.reactions[forIt]}'`);

  return response.data.reactions;
}

async function run() {
  try {
    // `comment-id` input defined in action metadata file
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

    const reactionsToCount = new Set([forIt, againstIt]);
    const reactionCounts = readReactionsCounts(octokit, repo, inputs.commentId, reactionsToCount)

    // core.setOutput("for", reactionCounts.get(forIt));
    // core.setOutput("against", reactionCounts.get(againstIt));
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
