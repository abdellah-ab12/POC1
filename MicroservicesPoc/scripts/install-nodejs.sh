#!/bin/bash

set -e

echo "Updating package list..."
sudo apt update

echo "Installing prerequisites..."
sudo apt install -y curl ca-certificates

echo "Installing Node.js LTS..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -

sudo apt install -y nodejs

echo ""
echo "======================================"
echo "Installation completed!"
echo "======================================"

echo "Node.js version:"
node -v

echo "npm version:"
npm -v
