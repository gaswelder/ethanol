const fs = require("fs");

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
}

module.exports = Interface;
