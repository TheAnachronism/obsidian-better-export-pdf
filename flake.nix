{
  description = "Development shell for Obsidian Better Export PDF";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";

  outputs = { nixpkgs, ... }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
    in
    {
      devShells = nixpkgs.lib.genAttrs systems (system:
        let
          pkgs = import nixpkgs { inherit system; };
        in
        {
          default = pkgs.mkShell {
            packages = [ pkgs.nodejs_24 pkgs.pnpm ];

            # Obsidian provides Electron; only its API types are needed here.
            ELECTRON_SKIP_BINARY_DOWNLOAD = "1";
          };
        });
    };
}
