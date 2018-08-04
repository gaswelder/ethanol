const child_process = require("child_process");
const fs = require("fs");
const path = require("path");

class ContractBlank {
	constructor(abi, bin) {
		if (!abi) throw new Error("abi argument is missing");
		if (!bin) throw new Error("bin argument is mising");
		if (bin == "0x") throw new Error("invalid bin value: " + bin);
		Object.assign(this, { abi, bin });
	}

	static async buildFrom(contractPath) {
		const dirname = "build";
		const buildDir = path.join(dirname, path.dirname(contractPath));
		const cmd = `solc --abi --bin --overwrite -o ${buildDir} ${contractPath}.sol`;
		console.log(cmd);
		child_process.execSync(cmd);
		return {
			abi: JSON.parse(
				fs.readFileSync(dirname + "/" + contractPath + ".abi").toString()
			),
			bin:
				"0x" + fs.readFileSync(dirname + "/" + contractPath + ".bin").toString()
		};
	}
}

module.exports = ContractBlank;
