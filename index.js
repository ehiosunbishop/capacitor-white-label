const argv = require('yargs').argv;
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { execSync } = require('child_process');

// Define default values or handle missing arguments as needed
const appId = argv.appId || null;
const isProd = argv.prod || false;
const build = argv.build || false;
const appName = argv.appName || 'Capacitor App';
const buildNumber = argv.buildNumber || 1;
const versionNumber = argv.versionNumber || '1.0.0';
const generateAssets = argv.generateAssets || false;
const appFlowChannel = argv.appFlowChannel || null;
const hostname = argv.hostname || appId;

// Check if appId is provided
if (!appId) {
     console.error('Error: App ID is required. Use the --appId flag to specify the App ID.');
     process.exit(1); // Exit with an error code
}

// Update capacitor.config.ts with the provided appId
const projectRoot = process.cwd(); // Get the current working directory where the script is executed
const capacitorConfigPath = path.join(projectRoot, 'capacitor.config.ts');

try {
     // Read the existing content of capacitor.config.ts
     let configContent = fs.readFileSync(capacitorConfigPath, 'utf-8');

     // Replace the value of the top-level appId with the provided appId
     configContent = configContent.replace(/appId:\s*'(.+?)'/, (match, group) => {
          // Replace only the first occurrence
          return match.replace(group, appId);
     });

     if (appName) {
          // Replace the value of the top-level appName with the provided appName
          configContent = configContent.replace(/appName:\s*'(.+?)'/, (match, group) => {
               // Replace only the first occurrence
               return match.replace(group, appName);
          });
     }

     // Replace the value of the hostname within the server object
     configContent = configContent.replace(/server:\s*{\s*hostname:\s*'(.+?)'/, (match, group) => {
          // Replace only the first occurrence
          return match.replace(group, hostname);
     });

     if (appFlowChannel) {
          // Replace the value of the channel within the LiveUpdates object
          configContent = configContent.replace(/plugins:\s*{\s*LiveUpdates:\s*{[^}]*channel:\s*'(.+?)'/, (match, group) => {
               // Replace only the first occurrence
               return match.replace(group, appFlowChannel);
          });
     }

     // Write the modified content back to capacitor.config.ts
     fs.writeFileSync(capacitorConfigPath, configContent, 'utf-8');
} catch (error) {
     console.error('Error updating capacitor.config.ts:', error.message);
     process.exit(1); // Exit with an error code
}

// Create or update the YAML file with specific details
const yamlFileName = 'trapeze-config.yaml';
const yamlFilePath = path.join(projectRoot, yamlFileName);

try {
     const yamlContent = `
platforms:
  android:
    appName: ${appName}
    versionName: ${versionNumber}
    versionCode: ${buildNumber}
    gradle:
     - file: app/build.gradle
       target:
         android:
           namespace:
       replace:
         namespace: "${appId}"
     
     - file: app/build.gradle
       target:
         android:
           defaultConfig:
             applicationId:
       replace:
         applicationId: "${appId}"
    xml:
     - resFile: values/strings.xml
       target: resources/string[@name="app_name"]
       replace: |
         <string name="app_name">${appName}</string>

     - resFile: values/strings.xml
       target: resources/string[@name="title_activity_main"]
       replace: |
         <string name="title_activity_main">${appName}</string>

     - resFile: values/strings.xml
       target: resources/string[@name="package_name"]
       replace: |
         <string name="package_name">${appId}</string>

     - resFile: values/strings.xml
       target: resources/string[@name="custom_url_scheme"]
       replace: |
         <string name="custom_url_scheme">${appId}</string>
  ios:
    targets:
      App:
        version: ${versionNumber}
        buildNumber: ${buildNumber}
        bundleId: ${appId}
        displayName: ${appName}
        productName: ${appName}
        buildSettings:
          INFOPLIST_KEY_CFBundleDisplayName: ${appName}
     `;

     // Write the YAML content to the file
     fs.writeFileSync(yamlFilePath, yamlContent, 'utf-8');
     console.log(`YAML file created at: ${yamlFilePath}`);
} catch (error) {
     console.error('Error creating YAML file:', error.message);
     process.exit(1); // Exit with an error code
}

if (build) {
     // Run yarn build or yarn build:prod based on --prod flag
     const buildCommand = isProd ? 'yarn build:prod' : 'yarn build';
     console.log(`Running command: ${buildCommand}`);

     // Determine whether to use sudo (for Unix-like systems) or not
     const useSudo = process.platform !== 'win32' && process.getuid() !== 0; // Check if not running as root (Unix-like)
     const commandPrefix = useSudo ? 'sudo ' : ''; // Add 'sudo ' prefix if necessary

     try {
          execSync(`${commandPrefix}${buildCommand}`, { stdio: 'inherit' }); // Execute the build command
     } catch (error) {
          console.error('Error executing build command:', error.message);
          process.exit(1); // Exit with an error code
     }
}

if (generateAssets) {
     // Run npx @capacitor/assets generate...  Generate splash screen and icon paths
     const assetsPath = `resources/${appId}`;

     // Run the command to generate splash screen and icon
     const generateCommand = `npx @capacitor/assets generate --assetPath=${assetsPath}`;
     console.log(`Running command: ${generateCommand}`);

     try {
          execSync(generateCommand, { stdio: 'inherit' }); // Execute the generate command
     } catch (error) {
          console.error('Error executing generate command:', error.message);
          process.exit(1); // Exit with an error code
     }
}


// Run npx run trapeze command
console.log('Running command: npx trapeze run');

try {
     execSync(`npx trapeze run ${yamlFileName} --android-project android --ios-project ios/App`, { stdio: 'inherit' });
} catch (error) {
     console.error('Error executing trapeze command:', error.message);
     process.exit(1); // Exit with an error code
}

// Run npx cap sync
console.log('Running command: npx cap sync');

try {
     execSync('npx cap sync', { stdio: 'inherit' }); // Execute cap sync
} catch (error) {
     console.error('Error executing cap sync command:', error.message);
     process.exit(1); // Exit with an error code
}

console.log('\x1b[32m%s\x1b[0m', 'App White Labeling was successful. You can run "npx cap open ios" to view the app now.');