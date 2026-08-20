# AWEpw Browser

AWEpw is a standalone Chromium-based browser shell for AWEARCHIVE. It is intentionally separate from the static public AWELIB site.

## Goals
- Real Chromium rendering instead of iframe embedding
- Normal browser-style User-Agent (no spoofing or site-specific identity masking)
- Address bar, back/forward, reload, home, tabs, downloads, DevTools
- Persistent cookies/session/profile
- Safe navigation and external-link handling
- AWEARCHIVE integration via an explicit `awe://open?url=` style entry point in the future

## Important
A static website cannot embed a second browser engine. This folder therefore contains the native AWEpw shell; the public AWEARCHIVE remains static.
