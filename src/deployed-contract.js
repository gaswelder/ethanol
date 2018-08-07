class DeployedContract {
	constructor(abi, addr) {
		this._abi = abi;
		this._addr = addr;
	}

	address() {
		return this._addr;
	}

	handle(web3) {
		return web3.eth.contract(this._abi).at(this._addr);
	}
}

module.exports = DeployedContract;
