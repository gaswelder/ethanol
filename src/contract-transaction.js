const Transaction = require("./transaction");

class ContractTransaction extends Transaction {
	constructor(web3, hash, contract) {
		super(web3, hash);
		this._contract = contract.handle(web3);
	}

	async logs() {
		const receipt = await this.receipt();

		// The receipt has logs in the binary form, so we have to use
		// the filter query.
		const logs = await this._getLogs(
			receipt.blockNumber,
			receipt.transactionHash
		);
		return logs;
	}

	async _getLogs(blockNumber, transactionHash) {
		const event = this._contract.allEvents;
		const filter = event({ fromBlock: blockNumber, toBlock: blockNumber });
		return new Promise(ok => {
			filter.get(function(err, list) {
				if (err) throw err;

				// A single block may have logs from the same contract, but
				// different transactions.
				const logs = list.filter(l => l.transactionHash == transactionHash);
				ok(logs);
			});
		});
	}
}

module.exports = ContractTransaction;
