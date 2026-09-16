# Essence Network Explora

A browser-based IPTV / VOD / local media-player interface with a deep blue **Essence** visual skin inspired by TV-style navigation.

## ✨ Features

- Live TV / channel browsing interface
- M3U / M3U8 playlist workflow
- Playlist categories and channel navigation
- VOD-style browsing area
- Local media player interface
- Video.js playback integration
- TV-style OSD and channel information
- Keyboard / remote-style spatial navigation
- Responsive layout for desktop and mobile
- Deep blue + cyan Essence theme
- PWA manifest and branded favicon

## 🚀 Run locally

The simplest option is to open `index.html` in a modern browser.

For a local HTTP server:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080/
```

An HTTP server is recommended when browser security restrictions affect local media or external resources.

## 🌐 GitHub Pages

1. Create a new GitHub repository.
2. Upload the contents of this folder.
3. Make sure `index.html` is in the repository root.
4. Open **Settings → Pages**.
5. Select **Deploy from a branch**.
6. Select the `main` branch and `/ (root)`.
7. Save and wait for the Pages deployment.

A GitHub Pages workflow is also included under `.github/workflows/pages.yml`.

## 📁 Project structure

```text
essence-network-explora/
├── .github/
│   └── workflows/
│       └── pages.yml
├── assets/
│   └── icons/
│       ├── favicon.svg
│       └── icon.svg
├── .gitignore
├── LICENSE
├── README.md
├── index.html
└── manifest.json
```

## 🎨 Branding

The repository icon uses a custom Essence mark combining a streaming/play symbol with the application's deep navy and cyan visual language.

## ⚠️ Content and streams

This repository contains the player/interface code. Only use streams, playlists, VOD, artwork, and other media that you own or are authorized to access and distribute.

## License

Released under the MIT License. See `LICENSE`.


## 📱 Android APK

This repository includes an Android WebView wrapper that bundles the same `index.html` app.

### Automatic APK build

Push the repository to GitHub. The workflow:

`.github/workflows/android-apk.yml`

automatically builds:

`Essence-Network-Explora.apk`

To get the APK:

1. Open the repository on GitHub.
2. Open **Actions**.
3. Select **Build Essence Network Explora APK**.
4. Open the completed workflow run.
5. Under **Artifacts**, download **Essence-Network-Explora**.
6. The artifact contains `Essence-Network-Explora.apk`.

The APK is currently a **debug APK** intended for testing/sideloading. A production Play Store release should use a signed release build with a private keystore.

### Android project

```text
android/
├── app/
│   ├── src/main/
│   │   ├── AndroidManifest.xml
│   │   ├── assets/index.html
│   │   ├── java/com/essence/network/MainActivity.java
│   │   └── res/
│   └── build.gradle
├── build.gradle
├── gradle.properties
└── settings.gradle
```
