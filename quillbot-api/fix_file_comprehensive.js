const fs = require('fs');
const path = require('path');

// Read the current file as binary to preserve exact structure
const filePath = path.join(__dirname, 'humanizer.js');
let content = fs.readFileSync(filePath, 'utf8');

// Fix the encoding issues
content = content
  .replace(/🔍/g, '🔍')
  .replace(/✅/g, '✅')
  .replace(/❌/g, '❌')
  .replace(/📊/g, '📊')
  .replace(/🔒/g, '🔒')
  .replace(/📸/g, '📸')
  .replace(/🚀/g, '🚀')
  .replace(/🔐/g, '🔐')
  .replace(/📚/g, '📚')
  .replace(/🔘/g, '🔘')
  .replace(/📍/g, '📍')
  .replace(/🎉/g, '🎉')
  .replace(/⏳/g, '⏳')
  .replace(/🤖/g, '🤖')
  .replace(/📋/g, '📋')
  .replace(/🎯/g, '🎯')
  .replace(/💥/g, '💥')
  .replace(/⚙️/g, '⚙️')
  .replace(/🔄/g, '🔄')
  .replace(/⚠️/g, '⚠️')
  .replace(/💡/g, '💡')
  .replace(/💬/g, '💬')
  .replace(/🎯/g, '🎯')
  .replace(/🌐/g, '🌐')
  .replace(/📧/g, '📧')
  .replace(/🎁/g, '🎁')
  .replace(/📊/g, '📊');

// Check if our method already exists by looking for the end of the class to insert it there
const classEndIndex = content.lastIndexOf('\n}');
const beforeEnd = content.substring(0, classEndIndex);
const afterEnd = content.substring(classEndIndex);

// Check if updateLoginStatus method already exists in the content
if (!content.includes('async updateLoginStatus')) {
  const methodToAdd = `
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
  }`;
  
  content = beforeEnd + '\n' + methodToAdd + afterEnd;
}

// Write the file back with proper encoding
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Successfully fixed encoding issues and added updateLoginStatus method to humanizer.js');