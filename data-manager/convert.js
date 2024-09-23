const fs = require('fs');
const xml2js = require('xml2js');

// Function to escape only special characters inside element content
function escapeInvalidChars(xml) {
  return xml.replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, '&amp;');  // Escape unescaped '&'
}

// Function to fix numeric element names using a map to ensure matching tags
function fixNumericElementNames(xml) {
  let index = 0;
  const tagMap = {};  // Map to keep track of numeric tags and their indices

  // Replace opening tags and store the index in the map
  xml = xml.replace(/<([0-9]+)(?=\s|>)/g, (match, p1) => {
    index++;
    tagMap[p1] = index;  // Store the index for this tag
    return `<item_${index}`;
  });

  // Replace closing tags using the map to match the corresponding opening tag
  xml = xml.replace(/<\/([0-9]+)>/g, (match, p1) => {
    const currentIndex = tagMap[p1];  // Retrieve the index for this tag
    return `</item_${currentIndex}>`;
  });

  return xml;
}

// Function to clean up any non-XML content before the first tag
function cleanInvalidCharactersBeforeXML(xml) {
  // Remove anything before the first XML tag, including invalid characters
  return xml.replace(/^[^<]*/, '');  // Remove characters before the first '<'
}

function cleanInvalidCharactersBeforeXML(xml) {
  // Remove anything before the first XML tag, including invalid characters
  return xml.replace(/^[^<]*/, '');  // Remove characters before the first '<'
}

// Helper function to determine if a string represents a pure number (no hyphens or letters)
function isNumeric(value) {
  return /^-?\d+(\.\d+)?$/.test(value);  // Regex to check for valid numbers, including negative and decimal numbers
}

// Helper function to recursively convert numeric strings to actual numbers, excluding 'objectID'
function convertNumericStringsToNumbers(obj) {
  if (Array.isArray(obj)) {
    return obj.map(convertNumericStringsToNumbers);  // Apply conversion to array elements
  } else if (typeof obj === 'object' && obj !== null) {
    // Apply conversion to object properties, but skip 'objectID'
    Object.keys(obj).forEach(key => {
      if (key !== 'objectID') {  // Exclude 'objectID' from conversion
        obj[key] = convertNumericStringsToNumbers(obj[key]);
      }
    });
    return obj;
  } else if (typeof obj === 'string' && isNumeric(obj)) {
    // If it's a numeric string and not a range or other non-numeric string, convert it to a number
    return Number(obj);
  }
  return obj;  // Return as is if not a numeric string
}


// Read and convert the XML
fs.readFile('records.xml', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading XML file:', err);
    return;
  }

  // Clean invalid characters before XML starts
  const cleanedXml = cleanInvalidCharactersBeforeXML(data);

  // Escape invalid characters within the text content (not tags)
  const safeXml = escapeInvalidChars(cleanedXml);

  // Fix numeric element names
  const fixedXml = fixNumericElementNames(safeXml);

  // Configure xml2js to handle multiple elements as arrays
  const parser = new xml2js.Parser({
    explicitArray: false,  // Makes sure repeated elements become arrays
    mergeAttrs: true,      // Merge attributes with the parent element
  });

  parser.parseString(fixedXml, (err, result) => {
    if (err) {
      console.error('Error parsing XML:', err);
      return;
    }

    // Convert any numeric strings to actual numbers
    const cleanedResult = convertNumericStringsToNumbers(result);

    // Convert the result to JSON and save it
    const jsonString = JSON.stringify(cleanedResult, null, 2);
    fs.writeFile('output1.json', jsonString, (err) => {
      if (err) {
        console.error('Error writing JSON file:', err);
        return;
      }
      console.log('Successfully converted XML to JSON');
    });
  });
});
