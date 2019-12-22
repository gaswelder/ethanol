const Mnemonic = require("../src/keys/mnemonic");
const { assert } = require("chai");

describe("mnemonic", () => {
	it("should derive the correct key", () => {
		const m = new Mnemonic(
			"maid large usual there sample dentist athlete eager shoe kitten worth vacuum"
		);
		const key = m.deriveKey(0);
		assert.equal(key.address(), "0x5e94baef74b60e98116b971e9240d914f4059e27");
	});
});
