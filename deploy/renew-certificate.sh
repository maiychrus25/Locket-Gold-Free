#!/bin/sh
set -eu
case " ${RENEWED_DOMAINS:-} " in
  *" reelsup.store "*) nginx -t && nginx -s reload ;;
esac
