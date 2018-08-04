const util = require("util");

const sleep = ms => new Promise(ok => setTimeout(ok, ms));

class Transaction {
	constructor(web3, hash) {
		this._hash = hash;
		this._web3 = web3;
		this._getTransactionReceipt = util.promisify(
			this._web3.eth.getTransactionReceipt.bind(this._web3.eth)
		);
		this._getTransaction = util.promisify(
			this._web3.eth.getTransaction.bind(this._web3.eth)
		);
	}

	async _receipt() {
		for (;;) {
			const r = await this._getTransactionReceipt(this._hash);
			if (r) return r;
			await sleep(1000);
		}
	}

	async _transaction() {
		for (;;) {
			const transaction = await this._getTransaction(this._hash);
			if (transaction.blockNumber) {
				return transaction;
			}
			await sleep(1000);
		}
	}

	async receipt() {
		const transaction = await this._transaction();
		const receipt = await this._receipt();

		// If status is not provided (we are no not on a byzantium chain),
		// determine failure by gas consumption.
		if (!("status" in receipt)) {
			receipt.status = receipt.gasUsed < transaction.gas ? "0x1" : "0x0";
		}
		if (receipt.status == 0) {
			const e = new Error("transaction failed");
			e.transactionReceipt = receipt;
			throw e;
		}
		return receipt;
	}

	async success() {
		await this.receipt();
	}
}

module.exports = Transaction;
