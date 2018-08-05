const bitcore = require("bitcore-lib");
const BitcoreMnemonic = require("bitcore-mnemonic");
const PrivateKey = require("./private-key");

function leftPadString(stringToPad, padChar, length) {
	var repreatedPadChar = "";
	for (var i = 0; i < length; i++) {
		repreatedPadChar += padChar;
	}

	return (repreatedPadChar + stringToPad).slice(-length);
}

const hdPathString = "m/44'/60'/0'/0";

class Mnemonic {
	constructor(value) {
		this._value = value;
	}

	deriveKey(n) {
		const mnemonic = this._value;
		var hdRoot = new BitcoreMnemonic(mnemonic).toHDPrivateKey().xprivkey;
		var hdRootKey = new bitcore.HDPrivateKey(hdRoot);
		var hdPathKey = hdRootKey.derive(hdPathString).xprivkey;

		var hdprivkey = new bitcore.HDPrivateKey(hdPathKey).derive(n);
		var privkeyBuf = hdprivkey.privateKey.toBuffer();

		var privkeyHex = privkeyBuf.toString("hex");
		if (privkeyBuf.length < 16) {
			throw new Error("Private key suspiciously small: < 16 bytes");
		}
		if (privkeyBuf.length > 32) {
			throw new Error("Private key larger than 32 bytes.");
		}
		if (privkeyBuf.length < 32) {
			privkeyHex = leftPadString(privkeyBuf.toString("hex"), "0", 64);
		}

		return new PrivateKey(privkeyHex);
	}
}

module.exports = Mnemonic;
