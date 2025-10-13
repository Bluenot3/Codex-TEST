#!/bin/sh
if [ -z "$husky_skip_init" ]; then
  husky_skip_init=1
  if [ "$HUSKY" = 1 ]; then
    echo "Husky already initialized"
  else
    export HUSKY=1
    sh -e "$0" "$@"
    exit $?
  fi
fi
