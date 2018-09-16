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
