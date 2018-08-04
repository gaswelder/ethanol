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
		return new Promise(resolve => {
			this._web3.eth.getBalance(addr, function(err, bal) {
				if (err) throw err;
				resolve(bal);
			});
		});
	}

	async give(user, amount) {
		return new Promise(resolve => {
			const tr = {
				from: this.address(),
				to: user.address(),
				value: amount
			};
			this._web3.eth.sendTransaction(tr, (err, hash) => {
				if (err) throw err;

				resolve(new Transaction(this._web3, hash));
			});
		});
	}

	async deploy(abi, bin, args) {
		return new Promise(ok => {
			this._web3.eth
				.contract(abi)
				.new(
					...args,
					{ data: bin, gas: 2100000, from: this.address() },
					function(err, contract) {
						if (err) throw err;
						if (contract.address) {
							ok(new Contract(abi, contract.address));
						}
					}
				);
		});
	}

	read(contract, func, args = []) {
		return new Promise(ok => {
			const h = contract.handle(this._web3);
			h[func].call(...args, (err, result) => {
				if (err) throw err;
				ok(result);
			});
		});
	}

	call(contract, func, args = []) {
		return new Promise(ok => {
			const h = contract.handle(this._web3);
			const tr = {
				from: this.address()
			};
			h[func].sendTransaction(...args, tr, (err, hash) => {
				if (err) throw err;
				ok(new ContractTransaction(this._web3, hash, contract));
			});
		});
	}
}

module.exports = User;
