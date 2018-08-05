var CryptoJS = require("crypto-js");
var EC = require("elliptic").ec;
var ec = new EC("secp256k1");
var nacl = require("tweetnacl");

class PrivateKey {
	constructor(value) {
		this._value = value;
	}

	address() {
		const privKey = this._value;
		var keyPair = ec.genKeyPair();
		keyPair._importPrivate(privKey, "hex");
		var compact = false;
		var pubKey = keyPair.getPublic(compact, "hex").slice(2);
		var pubKeyWordArray = CryptoJS.enc.Hex.parse(pubKey);
		var hash = CryptoJS.SHA3(pubKeyWordArray, { outputLength: 256 });
		var address = hash.toString(CryptoJS.enc.Hex).slice(24);
		return "0x" + address;
	}

	publicKey() {
		const privKey = this._value;
		var privKeyBase64 = new Buffer(privKey, "hex").toString("base64");
		var privKeyUInt8Array = nacl.util.decodeBase64(privKeyBase64);
		var pubKey = nacl.box.keyPair.fromSecretKey(privKeyUInt8Array).publicKey;
		var pubKeyBase64 = nacl.util.encodeBase64(pubKey);
		var pubKeyHex = new Buffer(pubKeyBase64, "base64").toString("hex");
		return pubKeyHex;
	}

	toBuffer() {
		return Buffer.from(this._value, "hex");
	}
}

module.exports = PrivateKey;
