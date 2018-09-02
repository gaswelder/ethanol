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
		return web3.eth.contract(this._abi).at(this._addr);
	}

	/**
	 * Returns events logged by this contract in the past.
	 *
	 * @param {string} eventName Name of the event
	 * @param {Number} fromBlock
	 * @param {Number} toBlock
	 * @returns {Promise<object[]>}
	 */
	history(eventName, fromBlock, toBlock) {
		const web3 = this._bc.web3();
		const contract = web3.eth.contract(this._abi).at(this._addr);
		if (!contract[eventName]) {
			return Promise.reject(new Error("unknown event: " + eventName));
		}
		const event = contract[eventName]({}, { fromBlock, toBlock });
		return new Promise(function(ok, fail) {
			event.get(function(err, list) {
				if (err) return fail(err);
				ok(list);
			});
		});
	}
}

module.exports = DeployedContract;
