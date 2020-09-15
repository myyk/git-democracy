import { Octokit } from "@octokit/rest";
import * as github from "@actions/github";

async function foobar(octokit: Octokit): Promise<string> {
  return "test";
}

const octokit = github.getOctokit("123") as Octokit;
foobar(octokit);
