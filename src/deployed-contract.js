const ContractTransaction = require("./contract-transaction");
const ContractEvent = require("./contract-event");

class DeployedContract {
	constructor(abi, addr, bc) {
		this._abi = abi;
		this._addr = addr;
		this._bc = bc;
	}

	address() {
		return this._addr;
	}

	handle(web3) {
		return new web3.eth.Contract(this._abi, this._addr);
	}

	/**
	 * Returns a transaction object representing an existing call for this contract.
	 *
	 * @param {string} hash Hash code of the transaction
	 * @param {string} comment Transaction's description for display purposes
	 * @returns {Promise<ContractTransaction>}
	 */
	async transaction(hash, comment = "") {
		const tr = new ContractTransaction(this._bc.web3(), hash, this, comment);
		const receipt = await tr.receipt();
		if (receipt.to.toLowerCase() != this._addr.toLowerCase()) {
			throw new Error(
				`transaction belongs to contract ${receipt.to}, not ${this._addr}`
			);
		}
		return tr;
	}

	/**
	 * Returns events logged by this contract in the past.
	 *
	 * @param {string} eventName Name of the event
	 * @param {Number} fromBlock
	 * @param {Number} toBlock
	 *
	 * @returns {Promise<ContractEvent[]>}
	 */
	async history(eventName, fromBlock, toBlock) {
		const handle = this.handle(this._bc.web3());
		if (!handle.events[eventName]) {
			return Promise.reject(new Error("unknown event: " + eventName));
		}
		const list = await handle.getPastEvents(eventName, {
			filter: {},
			fromBlock,
			toBlock
		});
		return list.map(obj => new ContractEvent(obj));
	}
}

module.exports = DeployedContract;
