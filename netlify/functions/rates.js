/**
 * Netlify Function: Unified Rates Source
 * Returns cost data from Google Sheets or JSON fallback
 */

const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

// Simple in-memory cache
let rateCache = null;
let cacheExpiry = null;

exports.handler = async (event, context) => {
  const requestId = context.awsRequestId || `rates-${Date.now()}`;
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || 'https://costflowai.com',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'X-Request-ID': requestId
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: 'Method not allowed',
        message: 'Only GET requests are supported',
        requestId
      })
    };
  }

  try {
    const cacheHours = parseInt(process.env.CACHE_RATES_HOURS) || 24;
    const cacheExpiryTime = cacheHours * 60 * 60 * 1000; // Convert to milliseconds
    const now = Date.now();

    // Check cache
    if (rateCache && cacheExpiry && now < cacheExpiry) {
      console.log('Returning cached rates:', requestId);
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
          'X-Cache-Expires': new Date(cacheExpiry).toISOString()
        },
        body: JSON.stringify({
          data: rateCache,
          cached: true,
          expires: new Date(cacheExpiry).toISOString(),
          requestId
        })
      };
    }

    const rateSource = process.env.REGION_FACTOR_SOURCE || 'rates';
    let ratesData = null;

    if (rateSource === 'sheets' && process.env.GOOGLE_SHEETS_ID) {
      console.log('Fetching rates from Google Sheets:', requestId);
      
      try {
        // Fetch from Google Sheets
        const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${process.env.GOOGLE_SHEETS_ID}/values/Rates!A:E`;
        const response = await fetch(sheetsUrl, {
          headers: {
            'Authorization': `Bearer ${process.env.GOOGLE_API_KEY}` // In production, use proper OAuth
          },
          timeout: 10000
        });

        if (!response.ok) {
          throw new Error(`Google Sheets API error: ${response.status}`);
        }

        const sheetsData = await response.json();
        
        // Convert Google Sheets format to our standard format
        if (sheetsData.values && sheetsData.values.length > 0) {
          const headers = sheetsData.values[0];
          const rows = sheetsData.values.slice(1);
          
          const costLibrary = {
            version: '1.0-sheets',
            last_updated: new Date().toISOString(),
            source: 'google_sheets',
            csi_divisions: {}
          };

          rows.forEach(row => {
            if (row.length >= 4 && row[0] && row[3]) { // CSI code and unit cost
              const csiCode = row[0].toString();
              const division = csiCode.substring(0, 2);
              
              if (!costLibrary.csi_divisions[division]) {
                costLibrary.csi_divisions[division] = {
                  name: getDivisionName(division),
                  items: {}
                };
              }
              
              costLibrary.csi_divisions[division].items[csiCode] = {
                description: row[1] || '',
                unit: row[2] || 'SF',
                unit_cost: parseFloat(row[3]) || 0,
                notes: row[4] || ''
              };
            }
          });
          
          ratesData = costLibrary;
        }
      } catch (sheetsError) {
        console.warn('Google Sheets fetch failed, falling back to JSON:', sheetsError.message);
        ratesData = null;
      }
    }

    // Fallback to JSON file
    if (!ratesData) {
      console.log('Using JSON cost library fallback:', requestId);
      
      try {
        const jsonPath = path.join(__dirname, '../../data/cost_library.json');
        const jsonData = await fs.readFile(jsonPath, 'utf8');
        ratesData = JSON.parse(jsonData);
        ratesData.source = 'json_fallback';
        ratesData.last_updated = ratesData.last_updated || new Date().toISOString();
      } catch (jsonError) {
        console.error('Failed to load JSON cost library:', jsonError.message);
        
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Rates unavailable',
            message: 'Unable to load cost data from any source',
            requestId
          })
        };
      }
    }

    // Cache the results
    rateCache = ratesData;
    cacheExpiry = now + cacheExpiryTime;

    console.log('Rates fetched successfully:', requestId, 'Source:', ratesData.source);

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
        'X-Cache-Expires': new Date(cacheExpiry).toISOString(),
        'X-Data-Source': ratesData.source
      },
      body: JSON.stringify({
        data: ratesData,
        cached: false,
        expires: new Date(cacheExpiry).toISOString(),
        requestId
      })
    };

  } catch (error) {
    console.error('Rates function error:', error.message, 'RequestID:', requestId);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to retrieve cost rates',
        requestId
      })
    };
  }
};

// Helper function to get division names
function getDivisionName(divisionCode) {
  const divisionNames = {
    '01': 'General Requirements',
    '02': 'Existing Conditions',
    '03': 'Concrete',
    '04': 'Masonry',
    '05': 'Metals',
    '06': 'Wood, Plastics & Composites',
    '07': 'Thermal & Moisture Protection',
    '08': 'Openings',
    '09': 'Finishes',
    '10': 'Specialties',
    '11': 'Equipment',
    '12': 'Furnishings',
    '13': 'Special Construction',
    '14': 'Conveying Equipment',
    '21': 'Fire Suppression',
    '22': 'Plumbing',
    '23': 'HVAC',
    '25': 'Integrated Automation',
    '26': 'Electrical',
    '27': 'Communications',
    '28': 'Electronic Safety & Security'
  };
  
  return divisionNames[divisionCode] || `Division ${divisionCode}`;
}