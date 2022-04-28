/*
    Generate a key pair and store it
*/

const generateButton = document.getElementById('generate-key');
// once button is clicked
generateButton.addEventListener("click", function () {
    // generate key pair
    var crypt = new JSEncrypt({ default_key_size: 2048 });
    crypt.getKey();
    // store key pair
    browser.storage.local.set(
        {
            "publicKey": crypt.getPublicKey(),
            "privateKey": crypt.getPrivateKey()
        }
    );
    window.location.reload();
    alert("New key pair created, store it in a safe place! Note: To view it, refresh the page");
});


/*
    Show the key pair
*/

//-- Public Key
// go on the addon storage
var getPublicKey = browser.storage.local.get('publicKey');
// show the public key in content
getPublicKey.then((res) => {
    document.getElementById('public-key').innerHTML = res.publicKey;
});
//-- Private Key
// go on the addon storage
var getPrivateKey = browser.storage.local.get('privateKey');
// show the public key in content
getPrivateKey.then((res) => {
    document.getElementById('private-key').innerHTML = res.privateKey;
});



/*
    Deleting Key pair
*/
const deleteButton = document.getElementById('delete-keys');
// once button is clicked
deleteButton.addEventListener("click", function () {
    // delete key pair
    if (confirm("Are you sure you want to delete the key pair?")) {
        browser.storage.local.remove(
            ['publicKey', 'privateKey']
        );
    }
});


/*
    Modify Key Pair
*/

const modifyButton = document.getElementById('modify-key');
// once button is clicked
modifyButton.addEventListener("click", function () {
    // get key pair
    var publicKey = document.getElementById("public-key").innerHTML;
    var privateKey = document.getElementById("private-key").innerHTML;
    // store key pair
    browser.storage.local.set(
        {
            "publicKey": publicKey,
            "privateKey": privateKey
        }
    );
    alert("Key pair saved");
});