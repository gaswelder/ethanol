const Transaction = require("./transaction");

class DeploymentTransaction extends Transaction {
	constructor(web3, hash, { abi, bc }) {
		super(web3, hash, "contract deployment");
		this._private = { abi, bc };
	}

	/**
	 * Returns the deployed contract.
	 *
	 * @returns {Promise<DeployedContract}
	 */
	async contract() {
		const { abi, bc } = this._private;
		const r = await this.receipt();
		const addr = r.contractAddress;
		return bc.contract(abi, addr);
	}
}

module.exports = DeploymentTransaction;
