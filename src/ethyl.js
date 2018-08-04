const net = require("net");
const Web3 = require("web3");
const ContractBlank = require("./contract-blank");
const User = require("./user");
const Vault = require("./vault");

const vault = new Vault();

module.exports = {
	root,
	user,
	ContractBlank
};

async function root() {
	const web3 = await getWeb3();
	return new User(web3, web3._defaultAccount);
}

async function user() {
	const web3 = await vault.makeWeb3();
	return new User(web3, web3._defaultAccount);
}

function getWeb3() {
	return new Promise(function(resolve, fail) {
		const path = "./data/geth.ipc";
		const provider = new Web3.providers.IpcProvider(path, net);
		const web3 = new Web3(provider);
		web3.eth.getAccounts(function(err, addrs) {
			if (err) return fail(err);
			web3._defaultAccount = addrs[0];
			resolve(web3);

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