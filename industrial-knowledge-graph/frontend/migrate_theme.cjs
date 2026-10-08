const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = fs.statSync(dirFile).isDirectory() ? walkSync(dirFile, filelist) : filelist.concat(dirFile);
    } catch (err) {
      if (err.code === 'OOM' || err.code === 'EMFILE') throw err;
    }
  });
  return filelist;
};

const files = walkSync('./src').filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Replace dark mode backgrounds
  content = content.replace(/bg-\[#1a2332\]/g, 'bg-white');
  content = content.replace(/bg-\[#111827\](\/50)?/g, 'bg-gray-50');
  content = content.replace(/bg-\[#0a0f1a\]/g, 'bg-gray-100');
  content = content.replace(/bg-gray-800(\/50|\/30)?/g, 'bg-white');

  // Replace dark mode borders
  content = content.replace(/border-\[#2d3f55\](\/80)?/g, 'border-gray-200');
  content = content.replace(/border-gray-700/g, 'border-gray-200');
  content = content.replace(/border-gray-800/g, 'border-gray-200');

  // Replace text colors
  content = content.replace(/text-gray-400/g, 'text-gray-500');
  content = content.replace(/text-gray-300/g, 'text-gray-600');
  
  // Safe replace text-white: only if not part of a primary/accent button
  // We'll replace all text-white, then revert the ones we know should stay white
  content = content.replace(/text-white/g, 'text-gray-900');
  
  // Revert buttons and badges
  content = content.replace(/bg-blue-600([^"']*)text-gray-900/g, 'bg-blue-600$1text-white');
  content = content.replace(/bg-purple-600([^"']*)text-gray-900/g, 'bg-purple-600$1text-white');
  content = content.replace(/bg-red-600([^"']*)text-gray-900/g, 'bg-red-600$1text-white');
  content = content.replace(/btn-primary([^"']*)text-gray-900/g, 'btn-primary$1text-white');
  content = content.replace(/btn-danger([^"']*)text-gray-900/g, 'btn-danger$1text-white');

  // Specific hovers
  content = content.replace(/hover:bg-\[#2d3f55\](\/30)?/g, 'hover:bg-gray-100');
  content = content.replace(/hover:border-\[#2d3f55\]/g, 'hover:border-gray-300');

  fs.writeFileSync(file, content, 'utf8');
});

console.log('Migration complete');
