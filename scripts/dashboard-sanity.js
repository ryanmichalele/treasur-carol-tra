(function () {
  'use strict';

  var PROJECT_ID = 'e9j72tow';
  var DATASET = 'production';
  var API_VERSION = 'v2024-01-01';

  function formatCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) return null;
    return '$' + Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatPercent(value) {
    if (value === null || value === undefined || isNaN(value)) return null;
    return Number(value).toFixed(2) + '%';
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el && text !== null && text !== undefined && text !== '') {
      el.textContent = text;
    }
  }

  function setHref(id, href) {
    var el = document.getElementById(id);
    if (el && href) {
      el.href = href;
    }
  }

  function applyDashboard(data) {
    if (!data) return;

    window.__tdAccounts = data.accounts || [];
    window.__tdCustomerName = data.customerName || '';
    window.__tdAccountNumber = data.accountNumber || '';

    var hasAuthUser = !!(sessionStorage.getItem('td_user') || localStorage.getItem('td_user'));

    if (!hasAuthUser) {
      setText('welcomeName', data.customerName);
      setText('accountNumberDisplay', data.accountNumber);
    }
    setText('surveillanceBanner', data.surveillanceBanner);

    setText('totalPortfolioValue', formatCurrency(data.totalPortfolioValue));
    setText('totalPortfolioLabel', data.totalPortfolioLabel);
    setText('totalPortfolioSub', data.totalPortfolioSub);

    setText('interestEarnedYtd', formatCurrency(data.interestEarnedYtd));
    setText('interestEarnedLabel', data.interestEarnedLabel);
    setText('interestEarnedSub', data.interestEarnedSub);

    if (data.pendingOrders !== null && data.pendingOrders !== undefined && !isNaN(data.pendingOrders)) {
      setText('pendingOrders', String(data.pendingOrders));
    }
    setText('pendingOrdersLabel', data.pendingOrdersLabel);
    setText('pendingOrdersSub', data.pendingOrdersSub);

    (data.accounts || []).forEach(function (account, i) {
      setText('account-' + i + '-name', account.name);
      setText('account-' + i + '-number', account.accountNumber);
      var bal = account.currentBalance !== undefined && account.currentBalance !== null ? account.currentBalance : account.balance;
      setText('account-' + i + '-balance', formatCurrency(bal));
      setText('account-' + i + '-label', account.balanceLabel);
    });

    (data.events || []).forEach(function (event, i) {
      setText('event-' + i + '-title', event.title);
      setText('event-' + i + '-description', event.description);
      setText('event-' + i + '-date', event.date);
    });

    (data.quickActions || []).forEach(function (action, i) {
      setText('action-' + i + '-label', action.label);
      setHref('action-' + i + '-href', action.href);
    });

    (data.notices || []).forEach(function (notice, i) {
      setText('notice-' + i + '-title', notice.title);
      setText('notice-' + i + '-description', notice.description);
    });

    setText('eeBondRate', formatPercent(data.eeBondRate));
    setText('eeBondSub', data.eeBondSub);
    setText('iBondRate', formatPercent(data.iBondRate));
    setText('iBondSub', data.iBondSub);
    setText('portfolioYield', formatPercent(data.portfolioYield));
    setText('portfolioYieldSub', data.portfolioYieldSub);
    setText('interestThisYear', formatCurrency(data.interestThisYear));
    setText('interestThisYearSub', data.interestThisYearSub);

    setText('helpTitle', data.helpTitle);
    setText('helpText', data.helpText);
    setText('helpButtonLabel', data.helpButtonLabel);
    setHref('helpButtonHref', data.helpButtonHref);
    setText('auctionsTitle', data.auctionsTitle);
    setText('auctionsText', data.auctionsText);
    setText('auctionsButtonLabel', data.auctionsButtonLabel);
    setHref('auctionsButtonHref', data.auctionsButtonHref);
  }

  var lastRev = null;
  var pollId = null;
  var POLL_MS = 5000;

  function load() {
    var url = 'https://' + PROJECT_ID + '.api.sanity.io/' + API_VERSION + '/data/query/' + DATASET +
      '?query=' + encodeURIComponent('*[_id == "dashboardAccount"][0]');
    fetch(url, { method: 'GET', cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('Sanity request failed: ' + res.status);
        return res.json();
      })
      .then(function (json) {
        var result = json && json.result;
        if (result && result._rev && result._rev === lastRev) return;
        if (result && result._rev) lastRev = result._rev;
        else if (result && result._updatedAt) lastRev = result._updatedAt;
        applyDashboard(result);
      })
      .catch(function (err) {
        console.error('Sanity dashboard fetch failed:', err && err.message ? err.message : err);
      });
  }

  function startPoll() {
    if (pollId) return;
    pollId = setInterval(function () {
      if (document.visibilityState === 'hidden') return;
      load();
    }, POLL_MS);
  }

  function init() {
    load();
    startPoll();
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') load();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
