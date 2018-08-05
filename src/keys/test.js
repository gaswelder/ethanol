const tap = require("tap");

const Mnemonic = require("./mnemonic");

tap.test(async function(t) {
	const m = new Mnemonic(
		"maid large usual there sample dentist athlete eager shoe kitten worth vacuum"
	);
	const key = m.deriveKey(0);
	t.equal(key.address(), "0x5e94baef74b60e98116b971e9240d914f4059e27");
});
