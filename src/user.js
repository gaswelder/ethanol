const Transaction = require("./transaction");
const ContractTransaction = require("./contract-transaction");
const DeploymentTransaction = require("./deployment-transaction");

class User {
	constructor(web3, addr, blockchain) {
		this._web3 = web3;
		this._addr = addr;
		this._bc = blockchain;
	}

	address() {
		return this._addr;
	}

	/**
	 * Returns balance of this user in Wei.
	 *
	 * @returns {Promise<BigNumber>}
	 */
	async balance() {
		return this._bc.balanceOf(this.address());
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
	 * Returns a transaction.
	 *
	 * @param {ContractBlank} contractBlank Contract definition.
	 * @param {array} args Contract constructor arguments.
	 * @returns {Promise<DeploymentTransaction>}
	 */
	deploy(contractBlank, args = []) {
		return new Promise((ok, fail) => {
			const callback = (err, contract) => {
				if (err) {
					fail(err);
					return;
				}
				ok(
					new DeploymentTransaction(this._web3, contract.transactionHash, {
						abi: contractBlank.abi,
						bc: this._bc
					})
				);
			};

			this._web3.eth
				.contract(contractBlank.abi)
				.new(
					...args,
					{ data: contractBlank.bin, gas: 2100000, from: this.address() },
					callback
				);
		});
	}

	read(contract, func, args = []) {
		return new Promise((ok, fail) => {
			const h = contract.handle(this._web3);
			if (!h[func]) {
				throw new Error("Undefined contract function: " + func);
			}
			h[func].call(...args, (err, result) => {
				if (err) return fail(err);
				ok(result);
			});
		});
	}

	/**
	 * Makes a contract function call from the user's accout.
	 *
	 * @param {DeployedContract} contract
	 * @param {string} func Name of the function to call
	 * @param {array} args Arguments for the function
	 * @returns {Promise<ContractTransaction>}
	 */
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
