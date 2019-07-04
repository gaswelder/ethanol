const tap = require("tap");
const { Compiler, Blockchain } = require("../src");

tap.tearDown(function() {
	process.exit(0);
});

const ipc = "ipc://./data/geth.ipc";
const local = Blockchain.at(ipc);

tap.test("contract functions", async function(t) {
	const comp = new Compiler();
	const ERC20 = await comp.compile("tests/TokenERC20");
	const god = await local.user();
	const coin = await god.deploy(ERC20, [100, "Testcoin", "TST"]);

	t.test("contract logs", async function(t) {
		await god.call(coin, "transfer", ["0x123", 1]).then(tr => tr.success());
		const logs = await coin.history("Transfer", 0, 10000);
		t.equal(logs.length, 1);
		const args = logs[0].args;
		t.equal(args.from, god.address());
		t.ok(args.value.eq(1));
	});

	t.test("transaction logs", async function(t) {
		const tr = await god.call(coin, "transfer", ["0x123", 1]);
		const logs = await tr.logs();
		t.equal(logs.length, 1);
		const args = logs[0].args;
		t.equal(args.from, god.address());
		t.ok(args.value.eq(1));
	});

	t.test("existing transaction", async function(t) {
		const tr0 = await god.call(coin, "transfer", ["0x123", 1]);
		const tr1 = await coin.transaction(tr0.hash());
		await tr1.success();
		t.ok(true);
	});

	t.test("non-existing transaction", async function(t) {
		// Non-existing hash
		const h =
			"0x98e6a7d3379a5f0184f234a89589657b4d161bf6c6764ccb74105cbb474bd598";
		try {
			await coin.transaction(h);
			t.ok(false, "Should have failed for unknown transaction");
		} catch (e) {
			t.ok(true);
		}
	});

	t.test("transaction address check", async function(t) {
		const [coin1, coin2] = await Promise.all([
			god.deploy(ERC20, [100, "Testcoin", "TST"]),
			god.deploy(ERC20, [100, "Testcoin", "TST"])
		]);
		const tr0 = await god.call(coin1, "transfer", ["0x123", 1]);
		const hash = tr0.hash();

		// Using the correct contract should succeed
		const tr1 = await coin1.transaction(hash);
		t.resolves(tr1.success());

		// Using another contract should fail right away
		t.rejects(coin2.transaction(hash));
	});
});
