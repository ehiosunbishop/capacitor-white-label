try {
     const yamlContent = `
platforms:
  android:
    appName: ${appName}
    packageName: ${appId}
    versionName: ${versionNumber}
    versionCode: ${buildNumber}
    manifest:
     - file: AndroidManifest.xml
       target: manifest
       attrs:
         package: ${appId}
    gradle:
     - file: app/build.gradle
       target:
         android:
           namespace:
       replace:
         namespace: ${appId}
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
         <string name="package_name">${appId}</string>
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
