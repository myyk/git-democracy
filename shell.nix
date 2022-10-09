{ pkgs ? import
    (builtins.fetchTarball {
    name = "nixos-21.11";
    url = "https://github.com/nixos/nixpkgs/archive/nixos-21.11.tar.gz";    })
    { }
}:

with pkgs;

mkShell {
  buildInputs = [
    nodejs
    yarn
  ];

  shellHook =
    ''
      # Install dependencies
      yarn install
    '';
}
