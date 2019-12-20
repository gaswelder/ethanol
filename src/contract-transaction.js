const Transaction = require("./transaction");

class ContractTransaction extends Transaction {
	constructor(web3, hash, contract, comment) {
		super(web3, hash, "contract call: " + comment);
		this.private = {
			contract
		};
	}

	/**
	 * Returns this transaction's logs.
	 *
	 * @returns {Promise<array>}
	 */
	async logs() {
		const receipt = await this.receipt();
		const { blockNumber, transactionHash } = receipt;

		const events = await this.private.contract.history(
			"allEvents",
			blockNumber,
			blockNumber
		);
		return events.filter(e => e.web3Data.transactionHash == transactionHash);
	}
}

module.exports = ContractTransaction;
