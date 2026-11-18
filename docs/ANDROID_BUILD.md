# N·EXIE LIBRARY — Android build

This repository is the source for the N·EXIE LIBRARY application.

## Android packaging

The Android package should be generated from the web application using a maintained Android wrapper (Capacitor is the recommended path when the existing frontend is compatible). The wrapper must point to the production web build; do not embed credentials or private API keys in the APK.

## Required release checks

- Confirm the web app builds successfully.
- Configure the Android application ID and signing configuration.
- Keep signing keys and passwords in GitHub Actions secrets; never commit them.
- Build a signed release APK or Android App Bundle in CI.
- Test login, navigation, file access, offline/error states, and accessibility on a physical Android device.

## Important

This guide does not mean an APK has already been built. The actual integration depends on the repository's frontend framework, build scripts, backend endpoints, and authentication implementation.