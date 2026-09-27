(function () {
    'use strict';

    var browserApi = typeof browser !== 'undefined' ? browser : (typeof chrome !== 'undefined' ? chrome : null);

    function getElement(selector) {
        return document.getElementById(selector) || document.querySelector(selector);
    }

    function loadKeys() {
        if (!browserApi || !browserApi.storage || !browserApi.storage.local) {
            return;
        }

        browserApi.storage.local.get(['publicKey', 'privateKey']).then(function (result) {
            var publicKeyElement = getElement('public-key');
            var privateKeyElement = getElement('private-key');

            if (publicKeyElement) {
                publicKeyElement.value = result.publicKey || '';
            }

            if (privateKeyElement) {
                privateKeyElement.value = result.privateKey || '';
            }
        }).catch(function (error) {
            console.error('[Tana] Unable to load key pair:', error);
        });
    }

    function saveKeyPair(publicKey, privateKey) {
        if (!browserApi || !browserApi.storage || !browserApi.storage.local) {
            return Promise.resolve();
        }

        return browserApi.storage.local.set({
            publicKey: publicKey || '',
            privateKey: privateKey || ''
        });
    }

    function bindButton(id, handler) {
        var button = getElement(id);
        if (button) {
            button.addEventListener('click', handler);
        }
    }

    function initializeOptions() {
        bindButton('generate-key', function () {
            var crypt = new JSEncrypt({ default_key_size: 2048 });
            crypt.getKey();

            saveKeyPair(crypt.getPublicKey(), crypt.getPrivateKey()).then(function () {
                window.location.reload();
                alert('New key pair created, store it in a safe place! Note: To view it, refresh the page');
            });
        });

        bindButton('delete-keys', function () {
            if (confirm('Are you sure you want to delete the key pair?')) {
                browserApi.storage.local.remove(['publicKey', 'privateKey']);
            }
        });

        bindButton('modify-key', function () {
            var publicKey = getElement('public-key').value;
            var privateKey = getElement('private-key').value;

            saveKeyPair(publicKey, privateKey).then(function () {
                alert('Key pair saved');
            });
        });

        loadKeys();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeOptions);
    } else {
        initializeOptions();
    }
})();