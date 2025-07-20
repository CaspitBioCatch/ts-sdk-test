#!/bin/bash

# The new version to append
new_version="$SHORT_VERSION.$GITHUB_RUN_NUMBER"
echo "$new_version"
# The JSON file path
json_file="$LIST_VERSIONS_FILE_NANE"

# Read, append, and save back to the file
jq ". += [\"$new_version\"]" "$json_file" > tmp.json && mv tmp.json "$json_file"

aws s3 cp "$json_file" "s3://rnd-bcdn/releases/latest/$json_file"
