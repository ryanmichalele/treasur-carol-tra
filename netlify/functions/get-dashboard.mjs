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

const QUERY = `*[_id == "dashboardAccount"][0]{
  _id,
  customerName,
  accountNumber,
  surveillanceBanner,
  totalPortfolioValue,
  totalPortfolioLabel,
  totalPortfolioSub,
  interestEarnedYtd,
  interestEarnedLabel,
  interestEarnedSub,
  pendingOrders,
  pendingOrdersLabel,
  pendingOrdersSub,
  accounts[]{
    _key,
    name,
    accountNumber,
    accountType,
    currency,
    status,
    currentBalance,
    balance,
    balanceLabel,
    address,
    bank,
    routingNumber,
    bankAddress,
    description
  },
  events[]{
    _key,
    title,
    description,
    date
  },
  quickActions[]{
    _key,
    label,
    href
  },
  notices[]{
    _key,
    title,
    description
  },
  eeBondRate,
  eeBondSub,
  iBondRate,
  iBondSub,
  portfolioYield,
  portfolioYieldSub,
  interestThisYear,
  interestThisYearSub,
  helpTitle,
  helpText,
  helpButtonLabel,
  helpButtonHref,
  auctionsTitle,
  auctionsText,
  auctionsButtonLabel,
  auctionsButtonHref
}`;

export const handler = async (event) => {
  const isPreview = event.queryStringParameters?.preview === 'true';
  
  try {
    let data;
    if (isPreview && API_TOKEN) {
      data = await client.fetch(QUERY, {}, { perspective: 'previewDrafts' });
    } else {
      data = await client.fetch(QUERY);
    }

    if (!data) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Dashboard account not found' }),
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
      body: JSON.stringify({ error: 'Failed to fetch dashboard data', message: err.message }),
    };
  }
};