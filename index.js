const argv = require('yargs').argv;
const fs = require('fs');
const path = require('path');
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

// Determine whether to use sudo (for Unix-like systems) or not
const useSudo = process.platform !== 'win32' && process.getuid() !== 0; // Check if not running as root (Unix-like)

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

// Update apple-app-site-association with the provided appId
const appleAppSiteAssociationPath = path.join(projectRoot, 'src/.well-known/apple-app-site-association');

try {
     // Read the existing content of apple-app-site-association
     let appleAppSiteAssociationContent = fs.readFileSync(appleAppSiteAssociationPath, 'utf-8');

     if (teamId && appId) {
          // Replace the appID in the apple-app-site-association content
          const updatedContent = appleAppSiteAssociationContent.replace(
               /"appID":\s*"(.*?)"/,
               (match, group) => {
                    // Replace only the appID portion with the new format teamId.appId
                    return match.replace(group, `${teamId}.${appId}`);
               }
          );

          // Write the modified content back to the apple-app-site-association file
          fs.writeFileSync(appleAppSiteAssociationPath, updatedContent, 'utf-8');
          console.log('Successfully updated apple-app-site-association');
     } else {
          console.error('ERROR: File not updated: teamId or appId was not provided.');
     }
} catch (error) {
     console.error('Error updating apple-app-site-association:', error.message);
     process.exit(1); // Exit with an error code
}

// Update assetlinks.json with the provided appId and sha256CertFingerprint
const androidAssetlinksPath = path.join(projectRoot, 'src/.well-known/assetlinks.json');

try {
     // Read the existing content of assetlinks.json
     let androidAssetlinksContent = fs.readFileSync(androidAssetlinksPath, 'utf-8');

     if (appId && sha256Cert) {
          // Replace the package_name and sha256_cert_fingerprints in the assetlinks.json content
          const updatedContent = androidAssetlinksContent
               .replace(/"package_name":\s*"(.*?)"/, (match, group) => {
                    // Replace only the package_name with the new appId
                    return match.replace(group, appId);
               })
               .replace(/"sha256_cert_fingerprints":\s*\["(.*?)"\]/, (match, group) => {
                    // Replace only the sha256_cert_fingerprints with the new sha256Cert
                    return match.replace(group, sha256Cert);
               });

          // Write the modified content back to the assetlinks.json file
          fs.writeFileSync(androidAssetlinksPath, updatedContent, 'utf-8');
          console.log('Successfully updated assetlinks.json');
     } else {
          console.error('ERROR: File not updated: appId or sha256Cert was not provided.');
     }
} catch (error) {
     console.error('Error updating assetlinks.json:', error.message);
     process.exit(1); // Exit with an error code
}

// Update the Java directory
const javaDirectory = path.join('android', 'app', 'src', 'main', 'java');
const javaPackagePath = appId.replace(/\./g, '/'); // Convert dots to slashes

try {
     // Delete existing files and folders in the java directory
     deleteFolderRecursive(path.join(projectRoot, javaDirectory));

     // Create new directory structure
     createDirectoryRecursive(path.join(javaDirectory, javaPackagePath));

     // Create MainActivity.java file with the specified content
     const mainActivityContent = `package ${appId};

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {}
`;

     const mainActivityFilePath = path.join(javaDirectory, javaPackagePath, 'MainActivity.java');
     fs.writeFileSync(mainActivityFilePath, mainActivityContent, 'utf-8');

     console.log(`Java directory updated at: ${javaDirectory}`);
} catch (error) {
     console.error('Error updating Java directory:', error.message);
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
         namespace: '"${appId}"'
     
     - file: app/build.gradle
       target:
         android:
           defaultConfig:
             applicationId:
       replace:
         applicationId: '"${appId}"'
    manifest:
     - file: AndroidManifest.xml
       target: manifest/application/activity
       attrs:
         android:name: ${appId}.MainActivity

     - file: AndroidManifest.xml
       target: manifest
       deleteAttributes:
         - package
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

     const commandPrefix = useSudo ? 'sudo ' : ''; // Add 'sudo ' prefix if necessary

     try {
          execSync(`${commandPrefix}${buildCommand}`, { stdio: 'inherit' }); // Execute the build command
     } catch (error) {
          console.error('Error executing build command:', error.message);
          process.exit(1); // Exit with an error code
     }
}

if (generateAssets) {
     const manifestFileName = 'src/manifest.webmanifest';
     const manifestFilePath = path.join(projectRoot, manifestFileName);

     if (manifestFilePath) cleanUpManifest(manifestFilePath);

     // Run npx @capacitor/assets generate...  Generate splash screen and icon paths
     const assetsPath = `resources/${appId}`;

     const commandPrefix = useSudo ? 'sudo ' : ''; // Add 'sudo ' prefix if necessary

     // Run the command to generate splash screen and icon
     const generateCommand = `${commandPrefix} npx @capacitor/assets generate --assetPath=${assetsPath}`;
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

console.log('\x1b[32m%s\x1b[0m', 'App White Labeling was successful. You can run "npx cap open [platform]" to view the app now.');


// Helper function to delete files and folders recursively
function deleteFolderRecursive(directoryPath) {
     if (fs.existsSync(directoryPath)) {
          fs.readdirSync(directoryPath).forEach((file, index) => {
               const filePath = path.join(directoryPath, file);
               if (fs.lstatSync(filePath).isDirectory()) {
                    deleteFolderRecursive(filePath);
               } else {
                    fs.unlinkSync(filePath);
               }
          });
          fs.rmdirSync(directoryPath);
     }
}

// Helper function to create directories recursively
function createDirectoryRecursive(directoryPath) {
     const parts = directoryPath.split(path.sep);
     for (let i = 1; i <= parts.length; i++) {
          const currentPath = path.join.apply(null, parts.slice(0, i));
          if (!fs.existsSync(currentPath)) {
               fs.mkdirSync(currentPath);
          }
     }
}

// Helper function to clean up the manifest.webmanifest
function cleanUpManifest(manifestFilePath) {
     // Read the existing content of manifest.webmanifest
     let manifestContent = fs.readFileSync(manifestFilePath, 'utf-8');

     try {
          // Parse the JSON content of the manifest
          const manifest = JSON.parse(manifestContent);

          // Clear the icons array in the manifest (make it empty)
          manifest.icons = [];

          // Convert the updated manifest object back to JSON string
          const updatedManifestContent = JSON.stringify(manifest, null, 2);

          // Write the updated manifest content back to the file
          fs.writeFileSync(manifestFilePath, updatedManifestContent, 'utf-8');

          console.log(`Manifest file cleaned up successfully.`);
     } catch (error) {
          console.log(`ERROR: cleaning up manifest.webmanifest :`, error.message);
     }
}