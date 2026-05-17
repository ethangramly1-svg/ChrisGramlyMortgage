#!/bin/bash
# Stop hook — runs `npm run build` if src/ or vite.config.ts has uncommitted
# changes. Blocks the response (Stop with decision:"block") if the build
# fails so Claude is forced to fix the error before replying.
#
# Reads hook input JSON on stdin (unused — we look at git working tree).
# Emits a JSON object on stdout to control the hook outcome.

# Quick gate: only run when frontend source has been touched
if ! git status --porcelain 2>/dev/null \
     | grep -qE '^.{2} (src/|vite\.config\.ts)'; then
  exit 0
fi

# Run the build. Capture stdout+stderr for the error report.
OUTPUT=$(npm run build 2>&1)
STATUS=$?

if [ $STATUS -eq 0 ]; then
  # Build passed — allow stop, stay silent
  exit 0
fi

# Build failed — block stop and feed the error back to Claude
jq -Rn --arg out "$OUTPUT" '{
  decision: "block",
  reason: ("BUILD FAILED — fix before responding to the user.\n\nnpm run build output:\n\n" + $out)
}'
exit 0
