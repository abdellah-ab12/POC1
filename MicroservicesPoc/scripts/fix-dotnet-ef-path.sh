#!/bin/bash
# À exécuter si `dotnet ef` renvoie "command not found" (typiquement après un
# redémarrage complet de la VM / reset de session KodeKloud).
#
# Cause : le PATH pointant vers les outils .NET globaux (~/.dotnet/tools) ne
# survit pas toujours au redémarrage, même s'il a déjà été ajouté à un profil
# shell, car KodeKloud ne charge pas toujours le même fichier (.bashrc vs
# .bash_profile) selon comment le terminal est ouvert.
#
# Usage : ./scripts/fix-dotnet-ef-path.sh

set -e

DOTNET_TOOLS_PATH="$HOME/.dotnet/tools"

echo "== 1. Installation de dotnet-ef si absent =="
if ! dotnet tool list -g | grep -q dotnet-ef; then
  dotnet tool install --global dotnet-ef
else
  echo "dotnet-ef déjà installé."
fi

echo "== 2. Ajout au PATH pour la session courante =="
export PATH="$PATH:$DOTNET_TOOLS_PATH"

echo "== 3. Persistance dans .bashrc ET .bash_profile =="
for profile in "$HOME/.bashrc" "$HOME/.bash_profile"; do
  touch "$profile"
  if ! grep -q "$DOTNET_TOOLS_PATH" "$profile"; then
    echo "export PATH=\"\$PATH:$DOTNET_TOOLS_PATH\"" >> "$profile"
    echo "  -> ajouté à $profile"
  else
    echo "  -> déjà présent dans $profile"
  fi
done

echo "== 4. Vérification =="
dotnet ef --version
