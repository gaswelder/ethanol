const { assert } = require("chai");
const { Compiler, Blockchain } = require("../src");

// after(() => process.exit(0));

const ipc = "ipc://./data/geth.ipc";
const local = Blockchain.at(ipc);
const SomeUserAddress = "0x5e94baef74b60e98116b971e9240d914f4059e27";

describe("contract functions", function() {
	const comp = new Compiler();
	let ERC20, god, coin;

	before(async () => {
		ERC20 = await comp.compile("tests/TokenERC20");
		god = await local.user();
		coin = await god
			.deploy(ERC20, [100, "Testcoin", "TST"])
			.then(tr => tr.contract());
	});

	it("contract logs", async function() {
		await god
			.call(coin, "transfer", [SomeUserAddress, 1])
			.then(tr => tr.success());
		const logs = await coin.history("Transfer", 0, 10000);
		assert.equal(logs.length, 1);
		const values = logs[0].values();
		assert.equal(values.from, god.address());
		assert.equal(values.value, "1");
	});

	it("transaction logs", async function() {
		const tr = await god.call(coin, "transfer", [SomeUserAddress, 1]);
		const logs = await tr.logs();
		assert.equal(logs.length, 1);
		const args = logs[0].values();
		assert.equal(args.from, god.address());
		assert.equal(args.value, "1");
	});

	it("existing transaction", async function() {
		const tr0 = await god.call(coin, "transfer", [SomeUserAddress, 1]);
		const tr1 = await coin.transaction(tr0.hash());
		await tr1.success();
	});

	it("non-existing transaction", async function() {
		// Non-existing hash
		const h =
			"0x98e6a7d3379a5f0184f234a89589657b4d161bf6c6764ccb74105cbb474bd598";
		try {
			await coin.transaction(h);
			throw "1";
		} catch (e) {
			if (e == "1") {
				throw new Error("Should have failed for unknown transaction");
			}
		}
	});

	it("transaction address check", async function() {
		const [coin1, coin2] = await Promise.all([
			god.deploy(ERC20, [100, "Testcoin", "TST"]).then(tr => tr.contract()),
			god.deploy(ERC20, [100, "Testcoin", "TST"]).then(tr => tr.contract())
		]);
		const tr0 = await god.call(coin1, "transfer", [SomeUserAddress, 1]);
		const hash = tr0.hash();

		// Using the correct contract should succeed
		const tr1 = await coin1.transaction(hash);
		await tr1.success();

		// Using another contract should fail right away
		try {
			await coin2.transaction(hash);
			throw "1";
		} catch (e) {
			if (e == "1") {
				throw new Error("should have rejected");
			}
		}
	});
});
