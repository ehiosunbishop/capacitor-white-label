const fs = require('fs');

// Helper function to delete files and folders recursively
export function deleteFolderRecursive(directoryPath) {
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
export function createDirectoryRecursive(directoryPath) {
     const parts = directoryPath.split(path.sep);
     for (let i = 1; i <= parts.length; i++) {
          const currentPath = path.join.apply(null, parts.slice(0, i));
          if (!fs.existsSync(currentPath)) {
               fs.mkdirSync(currentPath);
          }
     }
}