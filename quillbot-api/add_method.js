// This script fixes the humanizer.js file by adding the missing updateLoginStatus method
const fs = require('fs');
const path = require('path');

// Read the current file
const filePath = path.join(__dirname, 'humanizer.js');
let content = fs.readFileSync(filePath, 'utf8');

// Define the updateLoginStatus method to insert
const updateMethod = `
  async updateLoginStatus(sessionId, status) {
    if (!this.sessionDb) {
      await this.initSessionDatabase();
    }

    return new Promise((resolve, reject) => {
      // Update the status for the given session
      this.sessionDb.run(
        \`UPDATE session_status 
         SET status = ?, last_updated = CURRENT_TIMESTAMP 
         WHERE session_id = ?\`,
        [status, sessionId],
        (err) => {
          if (err) {
            console.error("❌ Error updating login status:", err.message);
            reject(err);
          } else {
            console.log(\`✅ Updated login status to: \${status} for session \${sessionId}\`);
            resolve();
          }
        }
      );
    });
  }
`;

// Find the position to insert the new method (before the closing of the class)
const classEndIndex = content.lastIndexOf('}');
const part1 = content.substring(0, classEndIndex);
const part2 = content.substring(classEndIndex);

// Combine parts with the new method
const newContent = part1 + '\n' + updateMethod + '\n' + part2;

// Write the file back
fs.writeFileSync(filePath, newContent, 'utf8');

console.log('✅ Successfully added updateLoginStatus method to humanizer.js');