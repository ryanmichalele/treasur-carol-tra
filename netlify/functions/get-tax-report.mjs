import { createClient } from '@sanity/client';

const PROJECT_ID = process.env.SANITY_PROJECT_ID || 'e9j72tow';
const DATASET = process.env.SANITY_DATASET || 'production';
const API_TOKEN = process.env.SANITY_API_TOKEN;

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: API_TOKEN,
});

const QUERY = `*[_type == "taxReport"] | order(taxYear desc)[0]{
  _id,
  taxYear,
  availableDate,
  accountNumber,
  forms[]{
    _key,
    formType,
    downloadUrl,
    description
  },
  instructions,
  notes
}`;

export const handler = async (event) => {
  const isPreview = event.queryStringParameters?.preview === 'true';
  const year = event.queryStringParameters?.year;
  
  try {
    let query = QUERY;
    if (year) {
      query = `*[_type == "taxReport" && taxYear == $year][0]{
        _id,
        taxYear,
        availableDate,
        accountNumber,
        forms[]{
          _key,
          formType,
          downloadUrl,
          description
        },
        instructions,
        notes
      }`;
    }
    
    let data;
    const params = year ? { year } : {};
    const options = isPreview && API_TOKEN ? { perspective: 'previewDrafts' } : {};
    
    if (year) {
      data = await client.fetch(query, params, options);
    } else {
      data = await client.fetch(query, {}, options);
    }

    if (!data) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Tax report not found' }),
      };
    }

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json', 
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error('Sanity fetch error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to fetch tax report data', message: err.message }),
    };
  }
};