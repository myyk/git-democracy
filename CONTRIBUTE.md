# How to setup local development
## If using nix
1. Install [nix](https://nixos.org/download.html)
2. `nix-env -i direnv`
3. [hook to your shell](https://direnv.net/docs/hook.html) 
4. `direnv allow .`

# How to publish an update

1. Create new branch.
1. `yarn global add yarn-upgrade-all`
1. `npx yarn-upgrade-all`
1. `yarn run all`
1. If everything passes create a new pull request.
1. After merging tag with the new version.
