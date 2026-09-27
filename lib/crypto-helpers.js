(function () {
  'use strict';

  function utf8ToBase64(value) {
    if (typeof value !== 'string') {
      return '';
    }

    return btoa(encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, function (_, hex) {
      return String.fromCharCode(parseInt(hex, 16));
    }));
  }

  function b64ToUtf8(value) {
    if (typeof value !== 'string' || value.length === 0) {
      return '';
    }

    try {
      var decoded = Array.from(atob(value), function (charCode) {
        return '%' + ('0' + charCode.toString(16)).slice(-2);
      }).join('');
      return decodeURIComponent(decoded);
    } catch (error) {
      return '';
    }
  }

  function chunkString(value, size) {
    if (typeof value !== 'string' || value.length === 0 || size <= 0) {
      return [];
    }

    const chunks = [];
    for (let index = 0; index < value.length; index += size) {
      chunks.push(value.slice(index, index + size));
    }

    return chunks;
  }

  function parseJson(value) {
    if (typeof value !== 'string') {
      return null;
    }

    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  const api = {
    utf8ToBase64,
    b64ToUtf8,
    chunkString,
    parseJson,
  };

  if (typeof window !== 'undefined') {
    window.TanaCryptoHelpers = api;
  }

  if (typeof globalThis !== 'undefined') {
    globalThis.TanaCryptoHelpers = api;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
