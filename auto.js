/*
    First part
*/
console.log('Tana launched successfully')


/*
    Signatures
*/
// verify authenticity of a message
function verifySigned(message, signature, publicKey) {
    var verify = new JSEncrypt();
    verify.setPublicKey(publicKey);
    var verified = verify.verify(message, signature, CryptoJS.SHA256);
    if (verified) {
        return true;
    }
    else {
        return false;
    }
}

// sign a message
function sign(message, privateKey) {
    var sign = new JSEncrypt();
    sign.setPrivateKey(privateKey);
    var signature = sign.sign(message, CryptoJS.SHA256, "sha256");
    return signature;
}


/*
    Encrypt / Decrypt
*/
// To avoid bugs with UTF-16 encryption
function utf8_to_b64(stringgg) {
    return window.btoa(encodeURIComponent(stringgg))
}


// Decrypt with the private key
function decrypt(message, privateKey, signaturePublicKey) {
    var encryptedArray = message[1];
    var decryptedArray = [];
    var decrypt = new JSEncrypt();

    for (var i = (1); i < encryptedArray.length; i++) {
        decrypt.setPrivateKey(privateKey);

        decryptedArray.push(decrypt.decrypt(encryptedArray[i]));
        //return decrypt.decrypt(message);
    };
    var cyphertext = decodeURIComponent(atob(decryptedArray.join("")));

    // signature verification
    var messageSignature = String(message[0].join(""));
    var sig = signaturePublicKey

    var verified = verifySigned(cyphertext, messageSignature, sig);
    if (verified == true) {
        return cyphertext;
    } else {
        return "cyphertext is not verified";
    };
};

// Encrypt
function encrypt(message, privateKey, publicKey) {
    var ciphertext = utf8_to_b64(message);

    var response = [];
    var encrypt = new JSEncrypt();

    // sign the message and insert it in the response array
    var signature = [];
    signature.push(sign(message, privateKey));
    response.push(signature);

    // split message in chunks of 240bit
    messageLength = ciphertext.length;
    var chunks = [];
    var chunkSize = 240;
    for (var i = 0; i < messageLength; i += chunkSize) {
        chunks.push(ciphertext.substr(i, chunkSize));
    };

    var simple = [];
    encrypt.setPublicKey(publicKey);

    for (var i = 0; i - 1 < chunks.length; i++) {
        simple.push(encrypt.encrypt(chunks[i - 1]));
    };
    response.push(simple);

    return response
};


/*
    auto decryption
*/
function autoDecrypt() {

    // get the public and private key
    var keyPair = browser.storage.local.get();
    keyPair.then(onGot, onError);

    // if with got them
    function onGot(item) {
        var localPublicKey = item.publicKey;
        var localPrivateKey = item.privateKey;

        // decrypt a message from a foreign user
        function simpleDecryption() {
            var elements = document.getElementsByClassName("tana-simple-decryption");
            for (var i = 0; i < elements.length; i++) {
                var element = elements[i];

                signaturePublicKey = element.getAttribute('public-key');
                var message = element.innerHTML;

                // encrypt with button
                if (element.getAttribute('decrypt-with-button') != null) {
                    buttonId = element.getAttribute('decrypt-with-button');
                    var button = document.getElementById(buttonId);

                    button.addEventListener("click", function () {
                        var decrypted = decrypt(JSON.parse(message), localPrivateKey, signaturePublicKey);
                        element.innerHTML = decrypted;
                    });
                } else {
                    var decrypted = decrypt(JSON.parse(message), localPrivateKey, signaturePublicKey);
                    element.innerHTML = decrypted;
                };
            };
        };
        simpleDecryption();

        // decrypt a message from the current user
        function ownDecryption() {
            var elements = document.getElementsByClassName("tana-own-decryption");
            for (var i = 0; i < elements.length; i++) {
                var element = elements[i];
                var message = element.innerHTML;

                // encrypt with button
                if (element.getAttribute('decrypt-with-button') != null) {
                    buttonId = element.getAttribute('decrypt-with-button');
                    var button = document.getElementById(buttonId);

                    button.addEventListener("click", function () {
                        var decrypted = decrypt(JSON.parse(message), localPrivateKey, localPublicKey);
                        element.innerHTML = decrypted;
                    });

                } else {
                    // without, autoEncrypt
                    var decrypted = decrypt(JSON.parse(message), localPrivateKey, localPublicKey);
                    element.innerHTML = decrypted;
                };
            };
        };
        ownDecryption();

        // decrypt all elements on multi format
        function multiDecryption() {
            var divs = document.getElementsByClassName("tana-multi-decryption");

            for (var i = 0; i < divs.length; i++) {
                var div = divs[i];
                var type = div.nodeName;
                if (type == "DIV") {
                    var elements = div.getElementsByClassName("tana-sub-multi-decryption");
                    var publicKeyUsed = div.getAttribute('public-key');

                    // encrypt with button
                    if (div.getAttribute('decrypt-with-button') != null) {

                        buttonId = div.getAttribute('decrypt-with-button');
                        var button = document.getElementById(buttonId);

                        button.addEventListener("click", function () {
                            for (var j = 0; j < elements.length; j++) {
                                var element = elements[j];
                                var message = element.innerHTML;
                                var decrypted = decrypt(JSON.parse(message), localPrivateKey, publicKeyUsed);
                                element.innerHTML = decrypted;
                            };
                        });

                    } else {
                        // decrypt all embedded elements
                        for (var j = 0; j < elements.length; j++) {
                            var element = elements[j];
                            var message = element.innerHTML;
                            var decrypted = decrypt(JSON.parse(message), localPrivateKey, publicKeyUsed);
                            element.innerHTML = decrypted;
                        };
                    };
                }
                else {
                    console.log('[Tana Error]: Wrong type for multi encryption, should be DIV');
                };
            };
        };
        multiDecryption();
    };

    function onError(error) {
        console.log(`Error: ${error}`);
    };
};
autoDecrypt();



/*
    auto encryption
*/
function autoEncrypt() {
    //get public and private keys
    var keyPair = browser.storage.local.get();
    keyPair.then(onGot, onError);

    function onGot(item) {
        var localPublicKey = item.publicKey;
        var localPrivateKey = item.privateKey;

        function autoEncryption() {

            var form = document.getElementById("tana-encryption-form");

            /////////////////////////
            var button = form.querySelector('[id="tana-form-encrypt"]');

            var receiverPublicKey = form.querySelector('[name="tana-public-key"]');
            // once submit is clicked
            button.addEventListener("click", function () {

                if (form != null) {

                    console.log("auto encrypt");

                    // simple encryption
                    var messages = form.querySelectorAll('[name="tana-to-encrypt"]');
                    if (receiverPublicKey.value != null) {
                        console.log("simple encryption");
                        for (var j = 0; j < messages.length; j++) {
                            var message = messages[j];
                            var messageValue = message.value;
                            var encrypted = encrypt(messageValue, localPrivateKey, receiverPublicKey.value);
                            message.value = JSON.stringify(encrypted);
                        }
                    }

                    // own encryption
                    var messages = form.querySelectorAll('[name="tana-to-own-encrypt"]');
                    console.log("own encryption")
                    for (var r = 0; r < messages.length; r++) {
                        var message = messages[r];
                        var messageValue = message.value;
                        var encrypted = encrypt(messageValue, localPrivateKey, localPublicKey);
                        message.value = JSON.stringify(encrypted);
                    }
                    form.querySelector('[name="tana-encryption-state"]').value = "true";

                }
            });
        }
        autoEncryption();
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }
}
autoEncrypt();