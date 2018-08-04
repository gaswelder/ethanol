const tap = require("tap");
const { user, root, deploy } = require("../src/ethanol");

tap.tearDown(function() {
	process.exit(0);
});

tap.test("main", async function(t) {
	const god = await root();
	const alice = await user();

	t.notEqual((await god.balance()).toString(), "0", "god has ether");
	//t.equal((await alice.balance()).toString(), "0", "alice has no ether");

	const coin = await deploy(god, "tests/TokenERC20", [100, "Testcoin", "TST"]);

	t.test("balances", async function(t) {
		t.equal(
			(await god.read(coin, "balanceOf", [god.address()])).toString(),
			"100000000000000000000"
		);
		t.equal((await god.read(coin, "name")).toString(), "Testcoin");
		t.equal(
			(await alice.read(coin, "balanceOf", [alice.address()])).toString(),
			"0"
		);
		t.equal(
			(await god.read(coin, "balanceOf", [alice.address()])).toString(),
			"0"
		);
	});

	t.test("direct transfer", async function(t) {
		const r = await god.call(coin, "transfer", [alice.address(), 1]);
		const logs = await r.logs();
		t.ok(logs.length > 0);
		t.equals(logs[0].event, "Transfer");

		t.equal(
			(await god.read(coin, "balanceOf", [god.address()])).toString(),
			"99999999999999999999"
		);
		t.equal(
			(await god.read(coin, "balanceOf", [alice.address()])).toString(),
			"1"
		);
	});
});
