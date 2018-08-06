const net = require("net");
const HookedWeb3Provider = require("hooked-web3-provider");
const Web3 = require("web3");
const ContractBlank = require("./contract-blank");
const User = require("./user");
const Mnemonic = require("./keys/mnemonic");
const Web3Signer = require("./keys/web3-signer");

module.exports = {
	user,
	ContractBlank
};

/**
 * Returns a user instance bound to the given RPC endpoint.
 *
 * @param {string} url RPC URL; may start with "ipc://" or "https://".
 * @param {object?} options
 * @returns {User}
 */
async function user(url, options) {
	const { web3, address } = await makeWeb3(url, options);
	return new User(web3, address);
}

function makeWeb3(url, options) {
	if (url.startsWith("ipc://")) {
		return forIPC(url, options);
	}
	if (url.startsWith("https://") || url.startsWith("http://")) {
		return forRPC(url, options);
	}
	throw new Error("unrecognized url: " + url);
}

function forIPC(path, options = {}) {
	for (const k in options) {
		throw new Error("unknown option for IPC: " + k);
	}
	path = path.substr("ipc://".length);
	return new Promise(function(resolve, fail) {
		const provider = new Web3.providers.IpcProvider(path, net);
		const web3 = new Web3(provider);
		web3.eth.getAccounts(function(err, addrs) {
			if (err) return fail(err);
			web3._defaultAccount = addrs[0];
			resolve({ web3, address: addrs[0] });

			// When working with geth --dev, the blocks are mined instantaneously
			// and only when needed. Web3, naturally, fails to handle this case and
			// sends the `eth_newBlockFilter` call too late, and transaction callbacks
			// are not called until the next block (which may never come in).
			// So we have to send bogus transactions to let web3 get blocks.
			function ping() {
				web3.eth.sendTransaction(
					{ from: addrs[0], to: addrs[0], value: 0 },
					function(err) {
						if (err) return fail(err);
					}
				);
			}
			setInterval(ping, 1000);
		});
	});
}

function forRPC(url, options = {}) {
	const defaults = {
		mnemonic:
			"science truck gospel alone trust effort scorpion laundry habit champion magic uncover",
		index: 0
	};
	options = Object.assign(defaults, options);
	for (const k in options) {
		if (!(k in defaults)) {
			throw new Error("unsupported option for RPC: " + k);
		}
	}

	const m = new Mnemonic(options.mnemonic);
	const key = m.deriveKey(options.index);
	const addr = key.address();

	const provider = new HookedWeb3Provider({
		host: url,
		transaction_signer: new Web3Signer(key)
	});
	const web3 = new Web3(provider);
	return { web3, address: addr };
}
