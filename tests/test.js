const tap = require("tap");
const { Compiler, Blockchain } = require("../src");

tap.tearDown(function() {
	process.exit(0);
});

const ipc = "ipc://./data/geth.ipc";
const rpc = "http://localhost:8545";

const local = Blockchain.at(ipc);
const remote = Blockchain.at(rpc);

tap.test("block number", async function(t) {
	const n1 = await local.blockNumber();
	const n2 = await remote.blockNumber();
	t.ok(n1 > 0, "Non-zero block number");
	t.ok(n1 === n2, "Same block number");
});

tap.test("block retrieval", async function(t) {
	const block = await local.block(1);
	t.type(block, "object");
});

tap.test("users", async function(t) {
	const alice = await remote.user({ index: 0 });
	const bob = await remote.user({ index: 1 });
	t.notEqual(alice.address(), bob.address());
});

tap.test("ipc user", async function(t) {
	const god = await local.user();
	t.notEqual((await god.balance()).toString(), "0", "god has ether");
});

tap.test("eth transfer", async function(t) {
	const god = await local.user();
	const alice = await remote.user({ index: 0 });
	const r = god.give(alice, 1).then(tr => tr.success());
	t.resolves(r);
});

tap.test("compiler options", async function(t) {
	const a = new Compiler({ "evm-version": "spuriousDragon" });
	const b = new Compiler({ "evm-version": "byzantium" });
	const path = "tests/TokenERC20";
	const image1 = await a.compile(path);
	const image2 = await b.compile(path);
	t.notEqual(image1.bin, image2.bin);
});

tap.test("contract logs", async function(t) {
	const comp = new Compiler();
	const ERC20 = await comp.compile("tests/TokenERC20");
	const god = await local.user();
	const coin = await god.deploy(ERC20, [100, "Testcoin", "TST"]);
	await god.call(coin, "transfer", ["0x123", 1]).then(tr => tr.success());

	const logs = await coin.history("Transfer", 0, 10000);
	t.equal(logs.length, 1);
	const args = logs[0].args;
	t.equal(args.from, god.address());
	t.ok(args.value.eq(1));
});

tap.test("ERC20", async function(t) {
	const comp = new Compiler();
	const ERC20 = await comp.compile("tests/TokenERC20");
	const god = await local.user();
	const alice = await remote.user();
	const bob = await remote.user({ index: 2 });

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
