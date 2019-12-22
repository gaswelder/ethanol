const { Compiler, Blockchain } = require("../src");
const { assert } = require("chai");

// after(() => process.exit(0));

const ipc = "ipc://./data/geth.ipc";
const rpc = "http://localhost:8545";

const local = Blockchain.at(ipc);
const remote = Blockchain.at(rpc);

describe("ERC20", async function() {
	const comp = new Compiler();
	let ERC20, god, alice, bob, coin;

	before(async () => {
		ERC20 = await comp.compile("tests/TokenERC20");
		god = await local.user();
		alice = await remote.user();
		bob = await remote.userFromMnemonic(
			"science truck gospel alone trust effort scorpion laundry habit champion magic uncover",
			2
		);
		await god.give(alice, 50000);
		coin = await god
			.deploy(ERC20, [100, "Testcoin", "TST"])
			.then(tr => tr.contract());
	});

	it("reading basic properties", async function() {
		assert.equal((await god.read(coin, "name")).toString(), "Testcoin");
		assert.equal((await god.read(coin, "symbol")).toString(), "TST");
	});

	it("balances", async function() {
		assert.equal(
			(await god.read(coin, "balanceOf", [god.address()])).toString(),
			"100000000000000000000"
		);
		assert.equal(
			(await alice.read(coin, "balanceOf", [alice.address()])).toString(),
			"0"
		);
		assert.equal(
			(await god.read(coin, "balanceOf", [alice.address()])).toString(),
			"0"
		);
	});

	it("direct transfer", async function() {
		const r = await god.call(coin, "transfer", [alice.address(), 1]);
		const events = await r.logs();
		assert.isNotEmpty(events);
		assert.equal(events[0].name(), "Transfer");

		const godBalance = () => god.read(coin, "balanceOf", [god.address()]);
		const aliceBalance = () => alice.read(coin, "balanceOf", [alice.address()]);

		assert.equal((await godBalance()).toString(), "99999999999999999999");
		assert.equal((await aliceBalance()).toString(), "1");

		await alice
			.call(coin, "transfer", [god.address(), 1])
			.then(tr => tr.success());
		assert.equal((await godBalance()).toString(), "100000000000000000000");
		assert.equal((await aliceBalance()).toString(), "0");
	});

	it("approval", async function() {
		const coin = await god
			.deploy(ERC20, [100, "Testcoin2", "TS2"])
			.then(tr => tr.contract());
		await god
			.call(coin, "transfer", [alice.address(), 40])
			.then(tr => tr.success());
		assert.equal(
			(await alice.read(coin, "balanceOf", [alice.address()])).toString(),
			"40"
		);
		assert.equal(
			(await bob.read(coin, "balanceOf", [bob.address()])).toString(),
			"0"
		);

		it("fail without approval", async function() {
			try {
				await god
					.call(coin, "transferFrom", [alice.address(), bob.address(), 5])
					.then(tr => tr.success());
				throw "1";
			} catch (e) {
				if (e == "1") {
					throw new Error("transferFrom should have failed");
				}
			}
		});

		it("ok with approval", async function() {
			await alice
				.call(coin, "approve", [god.address(), 6])
				.then(tr => tr.success());
			assert.equal(
				(
					await god.read(coin, "allowance", [alice.address(), god.address()])
				).toString(),
				"6"
			);
			await god
				.call(coin, "transferFrom", [alice.address(), bob.address(), 5])
				.then(tr => tr.success());
			assert.equal(
				(
					await god.read(coin, "allowance", [alice.address(), god.address()])
				).toString(),
				"1"
			);
			assert.equal(
				(await bob.read(coin, "balanceOf", [bob.address()])).toString(),
				"5"
			);
		});
	});
});
