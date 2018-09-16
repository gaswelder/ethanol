const child_process = require("child_process");
const fs = require("fs");
const path = require("path");
const util = require("util");

const readFile = util.promisify(fs.readFile);
const rmdir = util.promisify(fs.rmdir);
const mkdtemp = util.promisify(fs.mkdtemp);
const exec = util.promisify(child_process.exec);
const readdir = util.promisify(fs.readdir);
const unlink = util.promisify(fs.unlink);

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
		const dirname = await mkdtemp("ethanol-");
		const cmd = this.commandLine(contractPath, dirname);
		await exec(cmd);

		const contractName = path.basename(contractPath);
		const data = await image(
			dirname + "/" + contractName + ".abi",
			dirname + "/" + contractName + ".bin"
		);

		await clean(dirname);
		rmdir(dirname);
		return data;
	}

	commandLine(contractPath, buildDir) {
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

async function clean(dir) {
	const files = await readdir(dir);
	const deletions = files.map(filename => unlink(path.join(dir, filename)));
	return Promise.all(deletions);
}

async function image(abiPath, binPath) {
	const abi = JSON.parse((await readFile(abiPath)).toString());
	if (!abi) throw new Error("abi is empty");

	const bin = "0x" + (await readFile(binPath)).toString();
	if (bin == "0x") throw new Error("bin is empty");
	return { abi, bin };
}

module.exports = Compiler;
