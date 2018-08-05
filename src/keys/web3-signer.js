const EthereumTx = require("ethereumjs-tx");

class Web3Signer {
	constructor(privateKey) {
		this._privateKey = privateKey;
	}

	hasAddress(address, callback) {
		callback(null, address == this._privateKey.address());
	}

	signTransaction(txParams, callback) {
		const privateKey = this._privateKey.toBuffer();
		const tx = new EthereumTx(txParams);
		tx.sign(privateKey);
		callback(null, "0x" + tx.serialize().toString("hex"));
	}
}

module.exports = Web3Signer;
