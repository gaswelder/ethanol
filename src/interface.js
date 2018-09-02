const fs = require("fs");
const DeployedContract = require("./deployed-contract");

/**
 * Interface reprecents a contract's ABI definition.
 */
class Interface {
	constructor(abi) {
		this.abi = abi;
	}

	/**
	 * Creates an interface object reading the ABI from
	 * the file at the given path.
	 *
	 * @param {string} abiPath Path to the ".abi" file.
	 * @returns {Promise<Interface>}
	 */
	static fromFile(abiPath) {
		return new Promise(function(resolve) {
			fs.readFile(abiPath, function(err, data) {
				if (err) throw err;
				resolve(new Interface(JSON.parse(data)));
			});
		});
	}

	/**
	 * Returns a handle to a deployed contract with this interface.
	 *
	 * @param {string} contractAddress
	 * @returns {DeployedContract}
	 */
	at(contractAddress) {
		return new DeployedContract(this.abi, contractAddress);
	}
}

module.exports = Interface;
