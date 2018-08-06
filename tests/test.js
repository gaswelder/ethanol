const tap = require("tap");
const { user, ContractBlank } = require("../src/ethyl");

tap.tearDown(function() {
	process.exit(0);
});

const ipc = "ipc://./data/geth.ipc";
const rpc = "http://localhost:8545";

tap.test("users", async function(t) {
	const alice = await user(rpc, { index: 0 });
	const bob = await user(rpc, { index: 1 });
	t.notEqual(alice.address(), bob.address());
});

tap.test("ipc user", async function(t) {
	const god = await user(ipc);
	t.notEqual((await god.balance()).toString(), "0", "god has ether");
});

tap.test("ERC20", async function(t) {
	const ERC20 = await ContractBlank.buildFrom("tests/TokenERC20");
	const god = await user(ipc);
	const alice = await user(rpc);
	const bob = await user(rpc, { index: 2 });

	const coin = await god.deploy(ERC20, [100, "Testcoin", "TST"]);

	tap.test("reading basic properties", async function(t) {
		t.equal((await god.read(coin, "name")).toString(), "Testcoin");
		t.equal((await god.read(coin, "symbol")).toString(), "TST");
	});

	t.test("balances", async function(t) {
		t.equal(
			(await god.read(coin, "balanceOf", [god.address()])).toString(),
			"100000000000000000000"
		);
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

	t.test("approval", async function(t) {
		const coin = await god.deploy(ERC20, [100, "Testcoin2", "TS2"]);
		await god
			.call(coin, "transfer", [alice.address(), 40])
			.then(tr => tr.success());
		t.equal(
			(await alice.read(coin, "balanceOf", [alice.address()])).toString(),
			"40"
		);
		t.equal(
			(await bob.read(coin, "balanceOf", [bob.address()])).toString(),
			"0"
		);

		t.test("fail without approval", async function(t) {
			try {
				await god
					.call(coin, "transferFrom", [alice.address(), bob.address(), 5])
					.then(tr => tr.success());
				t.ok(false);
			} catch (e) {
				t.ok(true);
			}
		});

		t.test("ok with approval", async function(t) {
			await alice
				.call(coin, "approve", [god.address(), 6])
				.then(tr => tr.success());
			t.equal(
				(await god.read(coin, "allowance", [
					alice.address(),
					god.address()
				])).toString(),
				"6"
			);
			await god
				.call(coin, "transferFrom", [alice.address(), bob.address(), 5])
				.then(tr => tr.success());
			t.equal(
				(await god.read(coin, "allowance", [
					alice.address(),
					god.address()
				])).toString(),
				"1"
			);
			t.equal(
				(await bob.read(coin, "balanceOf", [bob.address()])).toString(),
				"5"
			);
		});
	});
});
