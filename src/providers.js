const http = require("http");
const https = require("https");
const utils = require("web3-utils");
const EthereumTx = require("ethereumjs-tx");

/**
 * Creates a provider suitable for web3. Hopefully.
 *
 * @param {object => Promise<object>} send Function that sends a payload to the network's RPC.
 */
const makeProvider = send => {
	return {
		send(payload, callback) {
			send(payload)
				.then(result => {
					callback(null, result);
				})
				.catch(err => {
					callback(err);
				});
		},
		disconnect() {
			//
		},
		supportsSubscriptions() {
			return false;
		}
	};
};
exports.makeProvider = makeProvider;

const request = (url, ...rest) =>
	url.startsWith("https://")
		? https.request(url, ...rest)
		: http.request(url, ...rest);

/**
 * Creates an HTTP sender.
 *
 * @param {string} rpcURL URL of the RPC resource.
 *
 * @returns {object => Promise<object>}
 */
const httpSender = rpcURL => {
	return payload =>
		new Promise((ok, fail) => {
			const opt = {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				}
			};
			const req = request(rpcURL, opt, res => {
				let body = "";
				res.on("data", chunk => {
					body += chunk;
				});
				res.on("end", () => {
					try {
						const result = JSON.parse(body);
						ok(result);
					} catch (err) {
						fail(err);
					}
				});
			});
			req.write(JSON.stringify(payload));
			req.end();
			req.on("error", fail);
		});
};
exports.httpSender = httpSender;

const signify = (provider, _privateKey) => {
	const sendAsIs = provider.send.bind(provider);

	const sendSigned = (payload, callback) => {
		if (payload.method != "eth_sendTransaction") {
			sendAsIs(payload, callback);
			return;
		}
		signPayload(payload)
			.then(signedPayload => {
				sendAsIs(signedPayload, callback);
			})
			.catch(callback);
	};

	provider.send = sendSigned;
	return provider;

	async function signPayload(payload) {
		const tx_params = payload.params[0];
		const sender = tx_params.from;

		const nonce = await getTransactionCount(sender);
		tx_params.nonce = utils.toHex(nonce);

		const privateKey = _privateKey.toBuffer();
		const tx = new EthereumTx(tx_params);
		tx.sign(privateKey);

		payload.method = "eth_sendRawTransaction";
		payload.params = ["0x" + tx.serialize().toString("hex")];
		return payload;
	}

	function getTransactionCount(sender) {
		return new Promise((ok, fail) => {
			sendAsIs(
				{
					jsonrpc: "2.0",
					method: "eth_getTransactionCount",
					params: [sender, "pending"],
					id: new Date().getTime()
				},
				function(err, result) {
					if (err != null) {
						fail(err);
					} else {
						ok(utils.hexToNumber(result.result));
					}
				}
			);
		});
	}
};
exports.signify = signify;
