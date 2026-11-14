---
title: How to Block YouTube Shorts in Chrome (and Keep the Rest of YouTube)
description: A step-by-step guide to blocking only YouTube Shorts in Chrome — including in-app navigation — while tutorials, search and subscriptions keep working.
slug: block-youtube-shorts-chrome
date: 2026-11-13
draft: true
---

# How to block YouTube Shorts in Chrome (and keep the rest of YouTube)

_Disclosure: this guide uses FocusFence, a Chrome extension we make. Path blocking is part of FocusFence Pro._

YouTube is two products in one: a library of tutorials, talks and music, and an endless feed of short videos. Blocking all of `youtube.com` throws out the useful half. Here's how to block **only Shorts**.

## Why "just block youtube.com" doesn't work

- You lose tutorials, lectures and the playlists you work to.
- You end up turning the blocker off "for a minute", and then you're back in the feed.
- Shorts can be opened in more than one way: a direct `youtube.com/shorts/…` link, the mobile site `m.youtube.com/shorts/…`, or a tap on the Shorts shelf from the home page, which changes the address **without loading a new page**.

A good Shorts blocker has to catch all three.

## Step by step with FocusFence

1. **Install FocusFence** from the Chrome Web Store and pin it to your toolbar.
2. Open **Settings → Blocklist**.
3. Choose **Path** as the rule type and enter `youtube.com/shorts`.
4. When Chrome asks, **allow access to youtube.com**. This lets FocusFence show its block page and catch Shorts opened from inside YouTube. If you decline, direct Shorts links are still blocked, but with Chrome's error page.
5. Test it: `youtube.com/shorts/anything` should show the FocusFence block page, while `youtube.com/watch?v=…` and search keep working.

What gets blocked:

| Address | Result |
|---|---|
| `https://www.youtube.com/shorts/abc123` | Blocked |
| `https://m.youtube.com/shorts/xyz` | Blocked (subdomains included) |
| Tapping a Short from the YouTube home page | Blocked (in-app navigation is caught) |
| `https://www.youtube.com/watch?v=…` | Still works |
| `https://www.youtube.com/` and search | Still work |

## Make it stick

- **Schedule it:** block Shorts only during work or study hours (Settings → Schedule).
- **Pair it with a focus timer:** a 25-minute Pomodoro session blocks everything on your list, even outside your schedule.
- **Add friction for "just once":** strict mode makes you wait 10 minutes and type a sentence before you can turn blocking off.

## Limitations to know about

- Path rules are a **Pro** feature in FocusFence. Free covers whole-site blocking.
- Any Chrome extension can be disabled from `chrome://extensions`.
- Incognito windows are only covered if you allow FocusFence in Incognito (FocusFence tells you when it isn't).
- This covers Chrome on your computer, not the YouTube app on your phone.
