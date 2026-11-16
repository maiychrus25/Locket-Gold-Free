# Locket and Gold: product research

Checked: 2026-11-16. Sources below are Locket's own Help Center and Apple's product/editorial pages, not claims from unofficial unlock services. Product availability may vary by platform and change over time.

| Feature | Official product | Lock Gold Free implementation and boundary |
| --- | --- | --- |
| Photos, private recipients, reactions, chat and history | Core close-friend sharing experience | Existing validated SDK operations, visual creation, feed, history, friend actions and conversations; no website charge |
| Upload from Camera Roll | Listed in Gold overview | Local image/video selection, preview, recipients and caption controls, free |
| Longer videos | Listed in Gold overview | Free video upload, thumbnail and compression; 32 MiB input and SDK storage limit of 6,291,455 bytes; provider may reject a variant |
| Unlimited friends | Core limit is 20; Gold removes it | No local 20-friend cap or payment gate; server-side account restrictions cannot be overridden by this website |
| Longer captions and viewers | Described by App Store editorial | 2,000-character application validation limit; styled captions and getViews reader free; no claim that this is the official Gold length |
| No advertising | Listed in Gold overview | No advertising, tracking integration, billing or subscription gating added to this application |
| Camera themes | Listed in Gold overview | Free web appearance themes and creator preview; does not change the official app's camera |
| Custom native app icons and Gold badge | Listed in Gold overview | Native app changes and subscription badge activation absent from SDK; do not offer a fake unlock button |
| Restore streak | Listed in Gold overview | No SDK operation; explicitly unavailable on this web app |
| Rollcall | Official weekly selection of 10 photos | SDK can read weekly posts. It has no Rollcall publishing operation; do not simulate an official published Rollcall |
| Spotify / Apple Music captions | Official app links a music provider | Caption presets available; provider linking and playback synchronization absent from SDK |
| Home Screen widgets and recaps | Described on official App Store listing | Web memory browsing is available; no native iOS/Android widget or official automatic recap API in this SDK |

No exact free/Gold video duration or caption-character boundary is established by the current Help Center pages. The site must show its own actual input limits instead of invented official numbers. The user reports official-app posting works; authenticated web posting, arbitrary Gold-equivalent payloads, friend counts over 20 and live viewer responses remain independently unverified.

## Sources

- [Gold overview](https://help.locket.com/en/articles/11057185-what-is-locket-gold-and-what-features-are-included), dated 2026-05-05.
- [Official friend limit](https://help.locket.com/en/articles/7915024-how-many-friends-can-i-have-on-locket).
- [Rollcall workflow](https://help.locket.com/en/articles/11057175-what-is-rollcall).
- [Music-provider connection](https://help.locket.com/en/articles/7914992-how-do-i-connect-spotify-or-apple-music-to-locket).
- [App Store editorial: Keep your social circle close](https://apps.apple.com/sg/iphone/story/id1775303660).
- [Official App Store listing](https://apps.apple.com/us/app/locket-widget/id1600525061).

## Verification scope

The SDK is an unofficial private-API client. Local SDK fixtures establish application behavior and request serialization; they do not certify Locket's current server contract or confer a paid subscription. Every previously supported backend operation remains available. At the operator's subsequent request, the UI presents consumer tasks and media utilities, with no technical control panel or JSON viewer. No user password, token or private request capture is needed for this research.
