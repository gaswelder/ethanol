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
	 * Returns a contract deployment transaction.
	 *
	 * @param {ContractBlank} contractBlank Contract definition.
	 * @param {array} args Contract constructor arguments.
	 *
	 * @returns {Promise<DeploymentTransaction>}
	 */
	async deploy(contractBlank, args = []) {
		if (
			typeof contractBlank != "object" ||
			!contractBlank.abi[0] ||
			!Array.isArray(contractBlank.abi[0].inputs)
		) {
			throw new Error(
				"contractBlank.abi is not a valid object (expecting a result of JSON.parse)"
			);
		}
		if (!contractBlank.bin.startsWith("0x")) {
			return this.deploy(
				{ ...contractBlank, bin: "0x" + contractBlank.bin },
				args
			);
		}
		return new Promise(async (ok, fail) => {
			const contract = new this._web3.eth.Contract(contractBlank.abi);
			const tr = contract.deploy({ data: contractBlank.bin, arguments: args });
			const estimatedGas = await tr.estimateGas();

			tr.send({
				from: this.address(),
				gas: estimatedGas
			})
				.on("error", fail)
				.on("transactionHash", hash => {
					ok(
						new DeploymentTransaction(this._web3, hash, {
							abi: contractBlank.abi,
							bc: this._bc
						})
					);
				});
		});
	}

	/**
	 * Makes a dry ("non-sending") call to a contracts function from
	 * the user's account.
	 *
	 * @param {DeployedContract} contract
	 * @param {string} func Name of the function to call
	 * @param {any[]} args Arguments for the function
	 *
	 * @return {Promise<any>} Return value of the function.
	 */
	read(contract, func, args = []) {
		const h = contract.handle(this._web3);
		if (!h.methods[func]) {
			throw new Error("Undefined contract function: " + func);
		}
		const call = h.methods[func](...args);
		return call.call({
			from: this.address(),
			gasPrice: 0
		});
	}

	/**
	 * Makes a contract function call from the user's accout.
	 *
	 * @param {DeployedContract} contract
	 * @param {string} func Name of the function to call
	 * @param {array} args Arguments for the function
	 *
	 * @returns {Promise<ContractTransaction>}
	 */
	call(contract, func, args = []) {
		return new Promise(async (ok, fail) => {
			const h = contract.handle(this._web3);
			if (!h.methods[func]) {
				throw new Error("Undefined contract function: " + func);
			}
			const call = h.methods[func](...args);
			let gas;
			try {
				gas = await call.estimateGas({ from: this.address() });
			} catch (err) {
				fail(err);
				return;
			}
			call
				.send({
					from: this.address(),
					// On pre-byzantium we have to check if all gas was used to determine
					// whether the transaction had thrown. If we allow the exact amount of
					// gas, we will most likely get a false positive. To avoid, give a little
					// more gas than needed.
					gas: gas + 100
				})
				.on("transactionHash", hash => {
					ok(new ContractTransaction(this._web3, hash, contract, func));
				})
				.on("error", fail);
		});
	}
}

module.exports = User;
