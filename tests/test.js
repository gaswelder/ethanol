const { assert } = require("chai");
const { Compiler, Blockchain } = require("../src");

// after(() => process.exit(0));

const ipc = "ipc://./data/geth.ipc";
const rpc = "http://localhost:8545";

const local = Blockchain.at(ipc);
const remote = Blockchain.at(rpc);

describe("test", function() {
	it("block number", async function() {
		const n1 = await local.blockNumber();
		const n2 = await remote.blockNumber();
		assert.isTrue(n1 > 0, "Non-zero block number");
		assert.isTrue(n1 === n2, "Same block number");
	});

	it("block retrieval", async function() {
		const block = await local.block(1);
		assert.typeOf(block, "object");
	});

	it("users", async function() {
		const m =
			"science truck gospel alone trust effort scorpion laundry habit champion magic uncover";
		const alice = await remote.userFromMnemonic(m, 0);
		const bob = await remote.userFromMnemonic(m, 1);
		assert.notEqual(alice.address(), bob.address());
	});

	// it("ipc user", async function() {
	// 	const god = await local.user();
	// 	t.notEqual((await god.balance()).toString(), "0", "god has ether");
	// 	console.log("god is at", god.address());

	// 	const someOtherUser = await local.userFromMnemonic(
	// 		"maid large usual there sample dentist athlete eager shoe kitten worth vacuum",
	// 		0
	// 	);
	// 	t.equal(
	// 		someOtherUser.address(),
	// 		"0x5e94baef74b60e98116b971e9240d914f4059e27"
	// 	);
	// 	t.equal(await someOtherUser.balance(), "0");
	// });

	it("eth transfer", async function() {
		const god = await local.user();
		const alice = await remote.user(
			"science truck gospel alone trust effort scorpion laundry habit champion magic uncover"
		);
		await god.give(alice, 1).then(tr => tr.success());
	});

	it("compiler options", async function() {
		const a = new Compiler({ "evm-version": "spuriousDragon" });
		const b = new Compiler({ "evm-version": "byzantium" });
		const path = "tests/TokenERC20";
		const [image1, image2] = await Promise.all([
			a.compile(path),
			b.compile(path)
		]);
		assert.notEqual(image1.bin, image2.bin);
	});
});
