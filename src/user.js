const Transaction = require("./transaction");
const ContractTransaction = require("./contract-transaction");
const DeployedContract = require("./deployed-contract");

class User {
	constructor(web3, addr) {
		this._web3 = web3;
		this._addr = addr;
	}

	address() {
		return this._addr;
	}

	/**
	 * Returns balance of this user in Wei.
	 *
	 * @returns {BigNumber}
	 */
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
			this._web3.eth.estimateGas(tr, (err, gas) => {
				if (err) return fail(err);
				// See comments in the contract call function.
				tr.gas = gas + 100;
				this._web3.eth.sendTransaction(tr, (err, hash) => {
					if (err) return fail(err);
					resolve(new Transaction(this._web3, hash, "ether transfer"));
				});
			});
		});
	}

	/**
	 * Deploys a contract.
	 *
	 * @param {ContractBlank} contractBlank Contract definition.
	 * @param {array} args Contract constructor arguments
	 * @returns {DeployedContract}
	 */
	async deploy(blankContract, args = []) {
		return new Promise((ok, fail) => {
			this._web3.eth
				.contract(blankContract.abi)
				.new(
					...args,
					{ data: blankContract.bin, gas: 2100000, from: this.address() },
					function(err, contract) {
						if (err) return fail(err);
						if (contract.address) {
							ok(new DeployedContract(blankContract.abi, contract.address));
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
				// On pre-byzantium we have to check if all gas was used to determine
				// whether the transaction had thrown. If we allow the exact amount of
				// gas, we will most likely get a false positive. To avoid, give a little
				// more gas than needed.
				tr.gas = gas + 100;

				h[func].sendTransaction(...args, tr, (err, hash) => {
					if (err) return fail(err);
					ok(new ContractTransaction(this._web3, hash, contract, func));
				});
			});
		});
	}
}

module.exports = User;
