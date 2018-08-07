const child_process = require("child_process");
const fs = require("fs");
const path = require("path");
const util = require("util");
const DeployedContract = require("./deployed-contract");

const readFile = util.promisify(fs.readFile);

class ContractBlank {
	constructor(abi, bin) {
		if (!abi) throw new Error("abi argument is missing");
		if (!bin) throw new Error("bin argument is mising");
		if (bin == "0x") throw new Error("invalid bin value: " + bin);
		Object.assign(this, { abi, bin });
	}

	at(address) {
		return new DeployedContract(this.abi, address);
	}

	static async buildFrom(contractPath, options = {}) {
		const dirname = "build";
		const buildDir = path.join(dirname, path.dirname(contractPath));
		const cmd = [
			"solc --abi --bin --overwrite",
			Object.entries(options)
				.map(([k, v]) => `--${k} ${v}`)
				.join(" "),
			`-o ${buildDir} ${contractPath}.sol`
		]
			.filter(x => x.length > 0)
			.join(" ");

		console.log(cmd);
		child_process.execSync(cmd);
		return this.loadFrom(
			dirname + "/" + contractPath + ".abi",
			dirname + "/" + contractPath + ".bin"
		);
	}

	static async loadFrom(abiPath, binPath) {
		const abi = JSON.parse((await readFile(abiPath)).toString());
		const bin = "0x" + (await readFile(binPath)).toString();
		return new ContractBlank(abi, bin);
	}
}

module.exports = ContractBlank;
