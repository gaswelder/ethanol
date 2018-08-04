const tap = require("tap");
const { user, root } = require("../src/ethanol");
const ContractBlank = require("../src/contract-blank");

tap.tearDown(function() {
	process.exit(0);
});

tap.test("main", async function(t) {
	const ERC20 = await ContractBlank.buildFrom("tests/TokenERC20");
	const god = await root();
	const alice = await user();
	const coin = await god.deploy(ERC20, [100, "Testcoin", "TST"]);

	t.notEqual((await god.balance()).toString(), "0", "god has ether");

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

	t.test("approval", async function(t) {
		const coin = await god.deploy(ERC20, [100, "Testcoin2", "TS2"]);
		const bob = await user();
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
