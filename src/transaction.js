class Transaction {
	constructor(web3, hash, comment) {
		this._hash = hash;
		this._web3 = web3;
		this._comment = comment;
	}

	/**
	 * Returns the transaction's hash code.
	 *
	 * @returns {string}
	 */
	hash() {
		return this._hash;
	}

	async receipt() {
		const transaction = await getTransaction(this._web3, this._hash);
		const receipt = await getTransactionReceipt(this._web3, this._hash);

		// If status is not provided (we are no not on a byzantium chain),
		// determine failure by gas consumption.
		if (!("status" in receipt)) {
			receipt.status = receipt.gasUsed < transaction.gas ? "0x1" : "0x0";
		}
		if (receipt.status == 0) {
			const e = new Error("transaction failed: " + this._comment);
			e.transactionReceipt = receipt;
			throw e;
		}
		return receipt;
	}

	/**
	 * Returns a promise for this transaction's successful mining.
	 * If the transaction fails, the promise is rejected.
	 *
	 * @returns {Promise<void>}
	 */
	async success() {
		await this.receipt();
	}
}

function getTransactionReceipt(web3, hash) {
	return new Promise(ok => {
		function loop() {
			web3.eth.getTransactionReceipt(hash, (err, receipt) => {
				if (err) throw err;
				if (receipt) {
					ok(receipt);
					return;
				}
				setTimeout(loop, 1000);
			});
		}
		loop();
	});
}

function getTransaction(web3, hash) {
	return new Promise((ok, fail) => {
		function loop() {
			web3.eth.getTransaction(hash, (err, transaction) => {
				if (err) return fail(err);
				if (!transaction) {
					return fail(new Error("unknown transaction: " + hash));
				}
				if (transaction.blockNumber) {
					ok(transaction);
					return;
				}
				setTimeout(loop, 1000);
			});
		}
		loop();
	});
}

module.exports = Transaction;
