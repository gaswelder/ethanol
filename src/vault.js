// const Mnemonic = require("bitcore-mnemonic");
const EthWallet = require("eth-lightwallet");
const HookedWeb3Provider = require("hooked-web3-provider");
const Web3 = require("web3");

const RPCAddr = "http://localhost:8545";

const password = "it doesn't matter really";
const mnemonic =
	"science truck gospel alone trust effort scorpion laundry habit champion magic uncover";

class Vault {
	constructor() {
		this._addresses = 0;
		this._data = new Promise(resolve => {
			EthWallet.keystore.createVault(
				{
					password,
					seedPhrase: mnemonic,
					hdPathString: "m/44'/60'/0'/0"
				},
				function(err, ks) {
					if (err) throw err;
					ks.passwordProvider = callback => {
						callback(null, password);
					};

					ks.keyFromPassword(password, function(err, key) {
						if (err) throw err;
						resolve({ ks, key });
					});
				}
			);
		});
	}

	async makeWeb3() {
		const { ks, key } = await this._data;
		ks.generateNewAddress(key);
		this._addresses++;
		const addr = ks.getAddresses()[this._addresses - 1];

		const provider = new HookedWeb3Provider({
			host: RPCAddr,
			transaction_signer: ks
		});
		const web3 = new Web3(provider);
		web3._defaultAccount = addr;
		return web3;
	}
}

module.exports = Vault;
