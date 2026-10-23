(function () {
    'use strict';

    var browserApi = typeof browser !== 'undefined' ? browser : (typeof chrome !== 'undefined' ? chrome : null);
    var helperApi = typeof window !== 'undefined' ? window.TanaCryptoHelpers : undefined;

    if (!browserApi || !browserApi.storage || !browserApi.storage.local) {
        return;
    }

    function getStorageKeys() {
        return Promise.resolve(browserApi.storage.local.get(['publicKey', 'privateKey']))
            .then(function (item) {
                return {
                    publicKey: item.publicKey || '',
                    privateKey: item.privateKey || ''
                };
            })
            .catch(function (error) {
                console.error('[Tana] Could not read keys:', error);
                return { publicKey: '', privateKey: '' };
            });
    }

    function readText(element) {
        if (!element) {
            return '';
        }

        return element.textContent || element.innerHTML || '';
    }

    function verifySigned(message, signature, publicKey) {
        if (!message || !signature || !publicKey) {
            return false;
        }

        try {
            var verify = new JSEncrypt();
            verify.setPublicKey(publicKey);
            return !!verify.verify(message, signature, CryptoJS.SHA256);
        } catch (error) {
            console.error('[Tana] Signature verification failed:', error);
            return false;
        }
    }

    function sign(message, privateKey) {
        if (!message || !privateKey) {
            return '';
        }

        try {
            var signer = new JSEncrypt();
            signer.setPrivateKey(privateKey);
            return signer.sign(message, CryptoJS.SHA256, 'sha256');
        } catch (error) {
            console.error('[Tana] Signing failed:', error);
            return '';
        }
    }

    function utf8ToBase64(value) {
        if (typeof helperApi !== 'undefined' && typeof helperApi.utf8ToBase64 === 'function') {
            return helperApi.utf8ToBase64(value);
        }

        return window.btoa(encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, function (_, hex) {
            return String.fromCharCode(parseInt(hex, 16));
        }));
    }

    function chunkString(value, size) {
        if (typeof helperApi !== 'undefined' && typeof helperApi.chunkString === 'function') {
            return helperApi.chunkString(value, size);
        }

        if (typeof value !== 'string' || value.length === 0 || size <= 0) {
            return [];
        }

        var chunks = [];
        for (var index = 0; index < value.length; index += size) {
            chunks.push(value.slice(index, index + size));
        }
        return chunks;
    }

    function parseJson(value) {
        if (typeof helperApi !== 'undefined' && typeof helperApi.parseJson === 'function') {
            return helperApi.parseJson(value);
        }

        try {
            return JSON.parse(value);
        } catch (error) {
            return null;
        }
    }

    function decrypt(message, privateKey, signaturePublicKey) {
        if (!Array.isArray(message) || !privateKey || !signaturePublicKey) {
            return 'cyphertext is not verified';
        }

        var encryptedArray = message[1] || [];
        var decryptedParts = [];
        var decryptor = new JSEncrypt();
        decryptor.setPrivateKey(privateKey);

        for (var index = 1; index < encryptedArray.length; index += 1) {
            var value = decryptor.decrypt(encryptedArray[index]);
            if (value) {
                decryptedParts.push(value);
            }
        }

        if (!decryptedParts.length) {
            return 'cyphertext is not verified';
        }

        var ciphertext = decodeURIComponent(Array.from(atob(decryptedParts.join('')), function (charCode) {
            return '%' + ('0' + charCode.toString(16)).slice(-2);
        }).join(''));

        var messageSignature = Array.isArray(message[0]) ? String(message[0].join('')) : '';
        var verified = verifySigned(ciphertext, messageSignature, signaturePublicKey);
        return verified ? ciphertext : 'cyphertext is not verified';
    }

    function encrypt(message, privateKey, publicKey) {
        if (!message || !privateKey || !publicKey) {
            return [];
        }

        var ciphertext = utf8ToBase64(message);
        var response = [];
        var signature = [sign(message, privateKey)];
        response.push(signature);

        var chunks = chunkString(ciphertext, 240);
        var encryptedChunks = [];
        var encryptor = new JSEncrypt();
        encryptor.setPublicKey(publicKey);

        for (var index = 0; index < chunks.length; index += 1) {
            var encryptedChunk = encryptor.encrypt(chunks[index]);
            if (encryptedChunk) {
                encryptedChunks.push(encryptedChunk);
            }
        }

        response.push(encryptedChunks);
        return response;
    }

    function bindDecryptAction(element, decryptHandler, buttonSelector) {
        if (!element) {
            return;
        }

        var buttonId = element.getAttribute(buttonSelector);
        if (!buttonId) {
            decryptHandler();
            return;
        }

        var button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', decryptHandler);
        }
    }

    function autoDecrypt() {
        getStorageKeys().then(function (keys) {
            if (!keys.privateKey) {
                return;
            }

            var localPublicKey = keys.publicKey;
            var localPrivateKey = keys.privateKey;

            function decryptSimpleMessage(element, publicKey) {
                var payload = parseJson(readText(element));
                if (!payload) {
                    return;
                }

                var decrypted = decrypt(payload, localPrivateKey, publicKey);
                if (decrypted !== 'cyphertext is not verified') {
                    element.textContent = decrypted;
                }
            }

            Array.prototype.forEach.call(document.getElementsByClassName('tana-simple-decryption'), function (element) {
                var publicKey = element.getAttribute('public-key') || '';
                bindDecryptAction(element, function () {
                    decryptSimpleMessage(element, publicKey);
                }, 'decrypt-with-button');
                if (!element.getAttribute('decrypt-with-button')) {
                    decryptSimpleMessage(element, publicKey);
                }
            });

            Array.prototype.forEach.call(document.getElementsByClassName('tana-own-decryption'), function (element) {
                bindDecryptAction(element, function () {
                    var payload = parseJson(readText(element));
                    if (!payload) {
                        return;
                    }

                    var decrypted = decrypt(payload, localPrivateKey, localPublicKey);
                    if (decrypted !== 'cyphertext is not verified') {
                        element.textContent = decrypted;
                    }
                }, 'decrypt-with-button');
                if (!element.getAttribute('decrypt-with-button')) {
                    var payload = parseJson(readText(element));
                    if (payload) {
                        var decrypted = decrypt(payload, localPrivateKey, localPublicKey);
                        if (decrypted !== 'cyphertext is not verified') {
                            element.textContent = decrypted;
                        }
                    }
                }
            });

            Array.prototype.forEach.call(document.getElementsByClassName('tana-multi-decryption'), function (div) {
                var type = div.tagName;
                if (type !== 'DIV') {
                    console.log('[Tana Error]: Wrong type for multi encryption, should be DIV');
                    return;
                }

                var publicKeyUsed = div.getAttribute('public-key') || '';
                var elements = div.getElementsByClassName('tana-sub-multi-decryption');

                bindDecryptAction(div, function () {
                    Array.prototype.forEach.call(elements, function (element) {
                        var payload = parseJson(readText(element));
                        if (!payload) {
                            return;
                        }

                        var decrypted = decrypt(payload, localPrivateKey, publicKeyUsed);
                        if (decrypted !== 'cyphertext is not verified') {
                            element.textContent = decrypted;
                        }
                    });
                }, 'decrypt-with-button');

                if (!div.getAttribute('decrypt-with-button')) {
                    Array.prototype.forEach.call(elements, function (element) {
                        var payload = parseJson(readText(element));
                        if (!payload) {
                            return;
                        }

                        var decrypted = decrypt(payload, localPrivateKey, publicKeyUsed);
                        if (decrypted !== 'cyphertext is not verified') {
                            element.textContent = decrypted;
                        }
                    });
                }
            });
        });
    }

    function autoEncrypt() {
        getStorageKeys().then(function (keys) {
            if (!keys.publicKey || !keys.privateKey) {
                return;
            }

            var form = document.getElementById('tana-encryption-form');
            if (!form) {
                return;
            }

            var button = form.querySelector('[id="tana-form-encrypt"]');
            var receiverPublicKey = form.querySelector('[name="tana-public-key"]');
            if (!button || !receiverPublicKey) {
                return;
            }

            button.addEventListener('click', function () {
                var messages = form.querySelectorAll('[name="tana-to-encrypt"]');
                if (receiverPublicKey.value) {
                    Array.prototype.forEach.call(messages, function (message) {
                        if (!message.value) {
                            return;
                        }

                        var encrypted = encrypt(message.value, keys.privateKey, receiverPublicKey.value);
                        message.value = JSON.stringify(encrypted);
                    });
                }

                var selfMessages = form.querySelectorAll('[name="tana-to-own-encrypt"]');
                Array.prototype.forEach.call(selfMessages, function (message) {
                    if (!message.value) {
                        return;
                    }

                    var encrypted = encrypt(message.value, keys.privateKey, keys.publicKey);
                    message.value = JSON.stringify(encrypted);
                });

                var state = form.querySelector('[name="tana-encryption-state"]');
                if (state) {
                    state.value = 'true';
                }
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            autoDecrypt();
            autoEncrypt();
        });
    } else {
        autoDecrypt();
        autoEncrypt();
    }
})();