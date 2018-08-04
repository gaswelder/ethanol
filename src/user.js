const Transaction = require("./transaction");
const ContractTransaction = require("./contract-transaction");
const Contract = require("./contract");

class User {
	constructor(web3, addr) {
		this._web3 = web3;
		this._addr = addr;
	}

	address() {
		return this._addr;
	}

	async balance() {
		const addr = this.address();
		return new Promise((ok, fail) => {
			this._web3.eth.getBalance(addr, function(err, bal) {
				if (err) return fail(err);
				ok(bal);
			});
		});
	}

	/**
	 * Transfers ether from this user to another user.
	 *
	 * @param {User} user The receiver
	 * @param {Number|String|BigNumber} amount Number of Wei to transfer.
	 */
	async give(user, amount) {
		return new Promise((resolve, fail) => {
			const tr = {
				from: this.address(),
				to: user.address(),
				value: amount
			};
			this._web3.eth.sendTransaction(tr, (err, hash) => {
				if (err) return fail(err);
				resolve(new Transaction(this._web3, hash));
			});
		});
	}

	/**
	 * Deploys a contract.
	 *
	 * @param {object} abi Parse JSON interface
	 * @param {string} bin String starting with '0x'
	 * @param {array} args Contract constructor arguments
	 */
	async deploy(abi, bin, args = []) {
		if (!abi) throw new Error("abi argument is missing");
		if (!bin) throw new Error("bin argument is mising");
		if (bin == "0x") throw new Error("invalid bin value: " + bin);
		return new Promise((ok, fail) => {
			this._web3.eth
				.contract(abi)
				.new(
					...args,
					{ data: bin, gas: 2100000, from: this.address() },
					function(err, contract) {
						if (err) return fail(err);
						if (contract.address) {
							ok(new Contract(abi, contract.address));
						}
					}
				);
		});
	}

	read(contract, func, args = []) {
		return new Promise((ok, fail) => {
			const h = contract.handle(this._web3);
			h[func].call(...args, (err, result) => {
				if (err) return fail(err);
				ok(result);
			});
		});
	}

	call(contract, func, args = []) {
		return new Promise((ok, fail) => {
			const h = contract.handle(this._web3);
			const tr = {
				from: this.address()
			};
			h[func].estimateGas(...args, tr, (err, gas) => {
				if (err) return fail(err);
				tr.gas = gas;
				h[func].sendTransaction(...args, tr, (err, hash) => {
					if (err) return fail(err);
					ok(new ContractTransaction(this._web3, hash, contract));
				});
			});
		});
	}
}

module.exports = User;
