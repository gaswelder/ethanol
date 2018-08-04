class Contract {
	constructor(abi, addr) {
		this._abi = abi;
		this._addr = addr;
	}

	handle(web3) {
		return web3.eth.contract(this._abi).at(this._addr);
	}
}

module.exports = Contract;
