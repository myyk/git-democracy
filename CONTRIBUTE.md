# How to setup local development
## If using dev containers
1. Setup all prereqs for [DevContainers](https://code.visualstudio.com/docs/devcontainers/containers#_getting-started)
1. Assuming you're using VSCode with `ms-vscode-remote.remote-containers` plugin.
1. Allow it to open the workplace in the container.

## If using gitpod (not recommeneded)
1. Open repo in gitpod.
1. ...
1. Profit.

## If using nix (not recommeneded)
1. Install [nix](https://nixos.org/download.html)
1. `nix-env -i direnv`
1. [hook to your shell](https://direnv.net/docs/hook.html) 
1. `direnv allow .`

# How to publish an update

1. Create new branch.
1. `yarn global add yarn-upgrade-all`
1. `npx yarn-upgrade-all`
1. `yarn run all`
1. If everything passes create a new pull request.
1. After merging tag with the new version.
