Capacitor White Label (cap-white-label)
=======================================

Capacitor White Label is a command-line tool designed to simplify the white-labeling process for Capacitor-based mobile applications. With this package, you can effortlessly customize various aspects of your app, such as the app ID, name, version, package name, splash screen, icon, and more, all through convenient command-line commands.

Installation
------------

To install Capacitor White Label, run the following command:

npm install -g cap-white-label

This installs the tool globally, allowing you to use it conveniently in any Capacitor project.

Usage
-----

After installation, you can use Capacitor White Label to configure and customize your app. Below are some common scenarios and the associated commands:

### Update App Configuration

Update the app ID, name, and other configuration parameters in the `capacitor.config.ts` file:

cap-white-label configure --appId=com.example.myapp --appName="My App" --appFlowChannel=stable

*   `--appId`: Set the unique identifier for your application.
*   `--appName`: Specify the name of your application.
*   `--buildNumber`: Specify the build number of your application.
*   `--versionNumber`: Specify the version number of your application.
*   `--hostname`: Configure the local hostname of the device. By default it uses `--appId`
*   `--appFlowChannel`: Set the desired app flow channel (e.g., 'stable', 'beta').
*   `--generateAssets` This will generate all icons and splash screen
*   `--build`: Build the app. This basically runs `yarn build | npm run build` under the hood.
*   `--prod`: Build your app for production `yarn build:prod`. Works with `--build`

Dependencies
------------

This package leverages on [@capacitor/assets](https://github.com/ionic-team/capacitor-assets) for generating icons and splash screen and also uses [Trapeze](https://trapeze.dev) for managing native configurations.

### White Labeling and Building

White-label your app and build it for production:

cap-white-label --build --appId=com.example.myapp --appName="My App" --prod

*   `--prod`: Build the app for production.
*   `--appId` and `--appName`: Similar to the configure command, these flags set the app ID and app name.

### Generate Splash Screen and Icon

Generate the necessary splash screen and icon assets:

    cap-white-label --appId='com.cap.white.label' --generateAssets

**Important Note:** The `capacitor/assets` folder will look for a folder inside `resources` with the name being the `appId`. Example `resources/com.cap.white.label/icon.png`

Contributing
------------

Contributions are welcome! If you encounter any issues or have suggestions for improvement, please open an issue or submit a pull request.

License
-------

Capacitor White Label is open-source software licensed under the [MIT License](LICENSE).
