const HookedWeb3Provider = require("hooked-web3-provider");
const Web3 = require("web3");
const Mnemonic = require("./keys/mnemonic");
const Web3Signer = require("./keys/web3-signer");

const RPCAddr = "http://localhost:8545";

const mnemonic =
	"science truck gospel alone trust effort scorpion laundry habit champion magic uncover";

class Vault {
	constructor() {
		this._addresses = 0;
	}

	async makeWeb3() {
		const m = new Mnemonic(mnemonic);
		const key = m.deriveKey(this._addresses);
		this._addresses++;
		const addr = key.address();

		const provider = new HookedWeb3Provider({
			host: RPCAddr,
			transaction_signer: new Web3Signer(key)
		});
		const web3 = new Web3(provider);
		web3._defaultAccount = addr;
		return web3;
	}
}

module.exports = Vault;
