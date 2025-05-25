#!/bin/bash

set -e

# Get the user's home directory
home_dir=$HOME

# Determine the shell configuration file based on the user's shell
if [ -n "$BASH_VERSION" ]; then
  # Bash shell
  shell_rc=".bashrc"
elif [ -n "$ZSH_VERSION" ]; then
  # Zsh shell
  shell_rc=".zshrc"
else
  echo "Unsupported shell. Please configure the PATH manually."
  exit 1
fi

# GitHub API URL for the latest release
api_url="https://api.github.com/repos/haoliangyu/terrac/releases/latest"

# Make a GET request to the GitHub API
response=$(curl -s "$api_url")

if [ "$(echo "$response" | jq -r '.message')" = "Not Found" ]; then
  echo "Repository or release not found."
  exit 1
fi

# Get the name of latest release
latest_release=$(echo "$response" | jq -r '.name')

# Get the operating system name
os=$(uname -s)

# Check the operating system and print a message
if [ "$os" = "Darwin" ] || [ "$os" = "Linux" ]; then
  # Determine the download URL based on the operating system
  case "$os" in
    Darwin)
      install_dir=$home_dir/bin
      download_url="https://github.com/haoliangyu/terrac/releases/download/$latest_release/terrac-macos"
      ;;
    Linux)
      install_dir=$home_dir/.local/bin
      download_url="https://github.com/haoliangyu/terrac/releases/download/$latest_release/terrac-linux"
      ;;
  esac

  # Download the binary
  mkdir -p $install_dir
  curl -o "$install_dir/terrac" -J -L -H "Accept: application/octet-stream" "$download_url"
  chmod +x "$install_dir/terrac"
else
  echo "Unsupported operating system: $os"
  exit 1
fi

echo ''
echo 'Terrac is installed successfully. You can run "terrac --help" to verify.'

# Check if ~/bin is already in PATH
if echo "$PATH" | grep -q "$install_dir"; then
  echo "Path '$install_dir' is already in PATH."
else
  # Add ~/bin to PATH and update shell configuration file
  echo "export PATH=\"$install_dir:\$PATH\"" >> "$home_dir/$shell_rc"
  echo "Added '$install_dir' to PATH in $shell_rc."

  # Apply the changes to the current shell session
  source "$home_dir/$shell_rc"
  echo "Changes applied to the current shell session."
fi
