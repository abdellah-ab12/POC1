#!/bin/bash

set -e

echo "Updating package list..."
sudo apt update

echo "Installing prerequisites..."
sudo apt install -y wget apt-transport-https ca-certificates

echo "Downloading Microsoft package repository..."

source /etc/os-release

wget https://packages.microsoft.com/config/ubuntu/${VERSION_ID}/packages-microsoft-prod.deb

sudo dpkg -i packages-microsoft-prod.deb
rm packages-microsoft-prod.deb

echo "Updating package list..."
sudo apt update

echo "Installing .NET 10 SDK..."
sudo apt install -y dotnet-sdk-10.0

echo ""
echo "======================================"
echo "Installation completed!"
echo "======================================"

echo "Installed .NET version:"
dotnet --version

echo ""
echo "Installed SDKs:"
dotnet --list-sdks

echo ""
echo "Installed Runtimes:"
dotnet --list-runtimes

