const child_process = require("child_process");
const fs = require("fs");
const path = require("path");
const util = require("util");

const readFile = util.promisify(fs.readFile);
const exec = util.promisify(child_process.exec);

const dirname = "build";

class Compiler {
	constructor(options = {}) {
		this.options = options;
	}

	/**
	 * Builds a contract image from the given source file.
	 *
	 * @param {string} contractPath Path to the contract's source file.
	 * @returns {Promise<Object>} Object with `bin` and `abi` fields.
	 */
	async compile(contractPath) {
		const cmd = this.commandLine(contractPath);
		console.log(cmd);

		await exec(cmd);
		return image(
			dirname + "/" + contractPath + ".abi",
			dirname + "/" + contractPath + ".bin"
		);
	}

	commandLine(contractPath) {
		const dirname = "build";
		const buildDir = path.join(dirname, path.dirname(contractPath));
		const cmd = [
			"solc --abi --bin --overwrite",
			Object.entries(this.options)
				.map(([k, v]) => `--${k} ${v}`)
				.join(" "),
			`-o ${buildDir} ${contractPath}.sol`
		]
			.filter(x => x.length > 0)
			.join(" ");

		return cmd;
	}
}

async function image(abiPath, binPath) {
	const abi = JSON.parse((await readFile(abiPath)).toString());
	if (!abi) throw new Error("abi is empty");

	const bin = "0x" + (await readFile(binPath)).toString();
	if (bin == "0x") throw new Error("bin is empty");
	return { abi, bin };
}

module.exports = Compiler;
