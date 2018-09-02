const net = require("net");
const HookedWeb3Provider = require("hooked-web3-provider");
const Web3 = require("web3");
const User = require("./user");
const Mnemonic = require("./keys/mnemonic");
const Web3Signer = require("./keys/web3-signer");

class Blockchain {
	constructor(url) {
		this.url = url;
	}

	/**
	 * Returns an object representing a blockchain user.
	 *
	 * @param {object} options
	 * @returns {Promise<User>}
	 */
	async user(options) {
		throw new Error("hmm");
	}

	/**
	 * Returns a blockchain object for the given RPC URL.
	 *
	 * @param {string} url RPC URL; may start with "ipc://" or "https://".
	 * @returns {Blockchain}
	 */
	static at(url) {
		if (url.startsWith("ipc://")) {
			return new LocalBlockchain(url);
		}
		if (url.startsWith("https://") || url.startsWith("http://")) {
			return new RemoteBlockchain(url);
		}
		throw new Error("unrecognized url: " + url);
	}

	/**
	 * Returns current block number.
	 *
	 * @returns {Promise<Number>}
	 */
	blockNumber() {
		const web3 = this.web3();
		return new Promise(function(ok, fail) {
			web3.eth.getBlockNumber(function(err, val) {
				if (err) return fail(err);
				ok(val);
			});
		});
	}

	/**
	 * Returns a block with the given number.
	 *
	 * @param {Number} blockNumber
	 * @returns {Promise<object>}
	 */
	block(blockNumber) {
		const web3 = this.web3();
		return new Promise(function(ok, fail) {
			web3.eth.getBlock(blockNumber, true, function(err, block) {
				if (err) return fail(err);
				ok(block);
			});
		});
	}
}

class RemoteBlockchain extends Blockchain {
	web3() {
		const provider = new Web3.providers.HttpProvider(this.url);
		const web3 = new Web3(provider);
		return web3;
	}

	async user(options) {
		const defaults = {
			mnemonic:
				"science truck gospel alone trust effort scorpion laundry habit champion magic uncover",
			index: 0
		};
		options = Object.assign(defaults, options);
		for (const k in options) {
			if (!(k in defaults)) {
				throw new Error("unsupported option for RPC user: " + k);
			}
		}

		const m = new Mnemonic(options.mnemonic);
		const key = m.deriveKey(options.index);
		const addr = key.address();

		const provider = new HookedWeb3Provider({
			host: this.url,
			transaction_signer: new Web3Signer(key)
		});
		const web3 = new Web3(provider);
		return new User(web3, addr);
	}
}

class LocalBlockchain extends Blockchain {
	web3() {
		const path = this.url.substr("ipc://".length);
		const provider = new Web3.providers.IpcProvider(path, net);
		const web3 = new Web3(provider);
		return web3;
	}

	user(options) {
		return new Promise((resolve, fail) => {
			for (const k in options) {
				throw new Error("unknown option for IPC user: " + k);
			}
			const path = this.url.substr("ipc://".length);
			const provider = new Web3.providers.IpcProvider(path, net);
			const web3 = new Web3(provider);
			web3.eth.getAccounts((err, addrs) => {
				if (err) return fail(err);
				resolve(new User(web3, addrs[0]));
				this.startPinger(web3, addrs[0]);
			});
		});
	}

	// When working with geth --dev, the blocks are mined instantaneously
	// and only when needed. Web3, naturally, fails to handle this case and
	// sends the `eth_newBlockFilter` call too late, and transaction callbacks
	// are not called until the next block (which may never come in).
	// So we have to send bogus transactions to let web3 get blocks.
	startPinger(web3, addr) {
		if (this.pinger) return;
		function ping() {
			web3.eth.sendTransaction({ from: addr, to: addr, value: 0 }, function(
				err
			) {
				if (err) throw err;
			});
		}
		this.pinger = setInterval(ping, 1000);
	}
}

module.exports = Blockchain;
