const fs = require('fs');
const path = require('path');

// Simple function to convert orange to purple by manipulating RGB values
function convertOrangeToPurple(buffer) {
  // This is a basic implementation - in a real scenario you'd use a proper image library
  // For now, let's create a simple SVG favicon with the purple color from our palette
  
  const purpleColor = '#8B5A9B'; // Our purple from the color palette
  
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <!-- Claude-style spark/asterisk icon -->
    <g fill="${purpleColor}">
      <path d="M16 4 L18 12 L16 16 L14 12 Z"/>
      <path d="M28 16 L20 14 L16 16 L20 18 Z"/>
      <path d="M16 28 L14 20 L16 16 L18 20 Z"/>
      <path d="M4 16 L12 18 L16 16 L12 14 Z"/>
      <path d="M24.49 7.51 L18.83 13.17 L16 16 L19.17 13.17 Z"/>
      <path d="M24.49 24.49 L18.83 18.83 L16 16 L19.17 18.83 Z"/>
      <path d="M7.51 24.49 L13.17 18.83 L16 16 L12.83 18.83 Z"/>
      <path d="M7.51 7.51 L13.17 13.17 L16 16 L12.83 13.17 Z"/>
    </g>
  </svg>`;
  
  return svgContent;
}

// Create the purple SVG favicon
const purpleFavicon = convertOrangeToPurple();

// Save as SVG
fs.writeFileSync(
  path.join(__dirname, '../src/assets/favicon.svg'),
  purpleFavicon
);

console.log('Purple favicon created as favicon.svg');