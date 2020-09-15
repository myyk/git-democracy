<p align="center">
  <a href="https://github.com/actions/typescript-action/actions"><img alt="typescript-action status" src="https://github.com/actions/typescript-action/workflows/build-test/badge.svg"></a>
</p>

# git-democracy

Use this GitHub action to add voting to your projects. :rocket:

Traditionally, most repositories need some number of approvers to make a change
and it's not clear what to do with controversial changes such as with standards
changes such as a change to linter formatting.

This GitHub action was created to allow projects to require a vote to pass
before letting a pull request be mergeable.

## How it works

When a Pull Request is made to your repository's main branch, a new comment is
posted by the action on the PR automatically as a place for :thumbsup:/
:thumbsdown: votes to be cast.

Only configured voters are counted. Votes are counted when the action is rerun
either by an update to the PR or manual rerunning it. Failed votes will list
reasons why the vote failed in the action's error messaging.

## Usage

### Workflow Integration

Create a new workflow in `.github/workflows/` as a new `.yaml` file.

```
name: 'Voting'
on:
  pull_request_target:

jobs:
  democracy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Evaluate vote
        uses: myyk/git-democracy@main
```

The name of the workflow must be `Voting` to match the badge that will be
linked to the voting comment.

It's important that the workflow runs as triggered by `pull_request_target` and
not `pull_request` so that a vote cannot be circumvented by a Pull Request
containing changes to the rules of voting.

### Recommended: Branch Settings

It's recommended to set your repository's branch settings to require the voting
as part of the `Branch protection rules` by enabling
`Require status checks to pass before merging` at a minimum enabling it for your
new workflow. It may need a little time after running the action before the
new workflow is selectable in the UI.

### Configuration

#### Voting

The action expects a `.voting.yml` defining the rules of voting.

`percentageToApprove` is the percentage of weighted votes needed to approve a
vote defined by the number of weighted for votes over the total number of
weighted vote. This number must be above 0 for this action to have any affect.

`minVotersRequired` is the minimum number of unique voters need to call the
results of a vote. These voters can be for or against. This number must be above
1 for the action to have any affect.

`minVotingWindowMinutes` is the minimum amount of time that must pass after the voting comment is created before any vote can pass.

Example:
```
---
percentageToApprove: 75
minVotersRequired: 3
minVotingWindowMinutes: 7200
```

#### Voters

The action expects a `.voters.yml` defining the voters and their vote weights.

Each entry should have the format of `<github-user>:<voting-weight>`. In a
normal fair election, every voter has would be configured to have a weight of 1.

```
---
myyk: 1
jienormous: 1
```

## Sample Project

An example of a fully wired up project: https://github.com/myyk/git-democracy-example
