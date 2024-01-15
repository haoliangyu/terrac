# A bash scrip to automate the terrac installation

#!/bin/bash

set -e

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
if [ "$os" = "Darwin" ]; then
  download_url="https://github.com/haoliangyu/terrac/releases/download/$latest_release/terrac-macos"
  curl -o "$TMPDIR/terrac" -J -L -H "Accept: application/octet-stream" "$download_url"
  sudo mv -f $TMPDIR/terrac /usr/local/bin/terrac
  sudo chmod +x /usr/local/bin/terrac
elif [ "$os" = "Linux" ]; then
  download_url="https://github.com/haoliangyu/terrac/releases/download/$latest_release/terrac-linux"
  curl -o "$TMPDIR/terrac" -J -L -H "Accept: application/octet-stream" "$download_url"
  sudo mv -f $TMPDIR/terrac /usr/local/bin/terrac
  sudo chmod +x /usr/local/bin/terrac
# Windows support is not added yet
# elif [ "$os" = "MINGW64_NT-10.0" ]; then
#   download_url="https://github.com/haoliangyu/terrac/releases/download/$latest_release/terrac-win"
#   curl -o "terrac" -J -L -H "Accept: application/octet-stream" "$download_url"
#   mv -f terrac /usr/local/bin/
else
  echo "Unsupported operating system: $os"
  exit 1
fi

echo ''
echo 'Terrac is installed successfully. You can run "terrac --help" to verify.'
