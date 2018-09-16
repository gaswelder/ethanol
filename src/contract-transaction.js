const Transaction = require("./transaction");

class ContractTransaction extends Transaction {
	constructor(web3, hash, contract, comment) {
		super(web3, hash, "contract call: " + comment);
		this._contract = contract.handle(web3);
	}

	async logs() {
		const receipt = await this.receipt();

		// The receipt has logs in the binary form, so we have to use
		// the filter query.
		return getLogs(
			this._contract,
			receipt.blockNumber,
			receipt.transactionHash
		);
	}
}

function getLogs(contract, blockNumber, transactionHash) {
	const event = contract.allEvents;
	const filter = event({ fromBlock: blockNumber, toBlock: blockNumber });
	return new Promise((ok, fail) => {
		filter.get(function(err, list) {
			if (err) return fail(err);

			// A single block may have logs from the same contract, but
			// different transactions.
			const logs = list.filter(l => l.transactionHash == transactionHash);
			ok(logs);
		});
	});
}

module.exports = ContractTransaction;
