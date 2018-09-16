# Ethyl

Humane JS wrappers around web3 and solc.

## Defining an RPC endpoint

In most cases the work starts with obtaining for a `Blockchain` object:

```js
const { Blockchain } = require("ethyl");
const bc = Blockchain.at("http://localhost:8545");
```

The argument to the `at` function is the URL of an RPC node representing the blockchain. Besides the `http` and `https` schemas the `ipc` schema can also be used:

```js
const { Blockchain } = require("ethyl");
const bc = Blockchain.at("ipc:///home/john/geth/geth.ipc");
```

The blockchain object provides several query functions about the blockchain:

```js
const latestBlockNumber = await bc.blockNumber();
const firstBlock = await bc.block(1);
const bobsBalance = await bc.balanceOf(
	"0x5e94baef74b60e98116b971e9240d914f4059e27"
);
```

## User accounts

User accounts are obtained with the `user` function of the blockchain object:

```js
const { Blockchain } = require("ethyl");
const bc = Blockchain.at("http://localhost:8545");
const alice = await bc.user();
```

If the blockchain is connected via IPC, then the local client's user will be assumed. If the interface is a remote RPC (JSON over HTTP), then a full user will be created on the fly.

The local user is typically an unlocked account that can send signed transactions. But a remote user by default can't sign transactions. In order to enable signing for a remote user a BIP44 mnemonic has to be provided as an option:

```js
const { Blockchain } = require("ethyl");
const bc = Blockchain.at("http://localhost:8545");

const bob = await bc.user({
	mnemonic: "eeny meeny miny moe catch a tiger by the toe"
});
```

The user objects can report their address and balance, and can be used to transfer Ether (in Wei units):

```js
const { Blockchain } = require("ethyl");
const bc = Blockchain.at("http://localhost:8545");

const alice = await bc.user({
	mnemonic: "eeny meeny miny moe catch a tiger by the toe"
});
const bob = await bc.user({ address: "0x..." });

const address = alice.address();
const balance = await alice.balance();

// Give 10 Wei to Bob
const transaction = await alice.give(bob, 10);
```

## Contracts

A contract image is a combination of `abi` and `bin` properties which have the corresponding outputs of a Solidity compiler. It will usually be obtained from files:

```js
const abi = fs.readFileSync("hello-world.abi");
const bin = fs.readFileSync("hello-world.bin");
const image = { abi, bin };
```

Given an existing contract image, it can be deployed from a user's account:

```js
const contract = await user.deploy(image, [arg1, arg2]);
```

The returned promise will turn into a `DeployedContract` instance which can be passed to `read` and `call` functions of users to statically read contract's variables, make dry function runs or make actual calls:

```js
const val = await alice.read(contract, "variableName");
const result = await alice.read(contract, "functionName", ["arg1", "arg2"]);
```

## Building contracts

A contract image can also be obtained by using the Compiler object:

```js
const { Compiler } = require("ethyl");
const com = new Compiler();
const image = await com.compile("hello-world.sol");
```

The `Compiler` object will call the host system's `solc` compiler through the command line.

The constructor takes a map of compiler options which exactly correspond to command line options of the `solc` compiler. For example, to get binaries compatible with older versions of the blockchain:

```js
const com = new Compiler({ "evm-version": "spuriousDragon" });
const image = await com.compile("hello-world.sol");
```

## Transactions

Transaction objects are returned for contract calls and plain ether transfers:

```js
const transaction1 = await alice.give(bob, 10);
const transaction2 = await alice.call(contract, "funcName");
```

The transaction's `success` function returns a promise which resolves when the transaction is mined successfully or rejects when the transaction is rejected:

```js
const transaction = await alice.call(contract, "funcName");
try {
	await transaction.success();
} catch (error) {
	console.log("transaction failed:", error);
}
```

An often used shorthand for making a transaction and waiting for its completion is:

```js
await alice.give(bob, 1).then(t => t.success());
```

This additional step has to be explicit because in an application one might need not to wait for an actual result for various reasons.

Contract call transactions, when mined successfully, can also return their event logs:

```js
const transaction = await alice.call(contract, "funcName");
const logs = await transaction.logs();
```

Obtaining logs assumes waiting for the transaction to be mined, so it's not necessary to await for transaction.success in this case.

A transaction can also be obtained from a contract using a known hash value:

```js
const transaction = await contract.transaction("0x1234abcd...");
```

The contract is necessary because it provides context (like an ABI definition) to the transaction so that the logs function will work. The `transaction` function will also verify the the transaction exists and belongs to the same contract.
