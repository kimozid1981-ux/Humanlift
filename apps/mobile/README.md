# HumanLift mobile app (Android and iPhone)

One Flutter code base builds both the Android app and the iPhone app. It talks to the same API as the website, so an account made on the website works in the app and the other way round.

**Status:** test build only. It has not been published to Google Play or the App Store, and it must not be until the founder approves a store submission (see `docs/FOUNDER_ACTIONS.md`).

## What the app does today

- Welcome screen in English or French, with the "test environment, no real money" banner.
- Create an account (applicant, donor or both, terms acceptance, 12-character minimum password).
- Sign in and sign out. A saved session is restored when the app opens.
- Account tab: profile name, roles, email-confirmation reminder.
- Privacy tab: request a copy of your data or deletion of your account.
- Help: how it works, contact form, report abuse.

It does not yet show public help requests, take donations or verify identity, because those features are not built on the server either.

## Security choices

- The app identifies itself to the API with the header `X-HumanLift-Client: mobile`. The API then returns a session token instead of a browser cookie.
- The token is kept in the phone's secure storage (Android Keystore, iOS Keychain), never in plain files.
- Android: app backups are switched off, plain `http` is blocked in release builds, and screenshots, screen recording and the app-switcher preview are blocked (`FLAG_SECURE`).
- Both platforms: a plain cover screen hides the app whenever it leaves the foreground, so the app switcher never shows personal details.
- No secrets are compiled into the app. Anything inside an app can be extracted by someone who downloads it.

## Running it on your computer

You need Flutter 3.47.7, plus Android Studio (for Android) or a Mac with Xcode (for iPhone).

1. Start the API as described in `docs/guides/local-development.md`.
2. In this folder run `flutter pub get`.
3. Android emulator: `flutter run` (the app uses `http://10.0.2.2:4000/v1`, which is how the emulator reaches your computer).
4. iPhone simulator: `flutter run --dart-define=API_BASE_URL=http://localhost:4000/v1`.

## Checks

- `flutter analyze` checks the code.
- `flutter test` runs 13 automated screen tests against a fake server.
- GitHub runs both, then builds an Android test APK, on every pull request that changes this folder (`.github/workflows/mobile.yml`). The APK can be downloaded from the run's "Artifacts" section.
- The iPhone build runs only when started by hand from the Actions tab ("Mobile app", "Run workflow", tick "Also build the iPhone app"). It is unsigned, so it proves the app compiles but cannot be installed on a phone. Installing on a real iPhone needs an Apple Developer account.

## Configuration

| Setting | How to set it | Default |
|---|---|---|
| API address | `--dart-define=API_BASE_URL=...` | `http://10.0.2.2:4000/v1` |
| Environment | `--dart-define=APP_ENVIRONMENT=...` | `development` (only `production` hides the test banner) |

The app ID is `org.humanlift.humanlift` on both platforms. It is a placeholder that should be confirmed before the first store upload, because it cannot be changed after that.
