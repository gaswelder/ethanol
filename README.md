# Ethanol

Humane JS wrappers around web3 and solc.

## Defining an RPC endpoint

The work starts with getting a `Blockchain` object:

```js
const { Blockchain } = require("ethanol");
const bc = Blockchain.at("http://localhost:8545");
```

The argument to the `at` function is the URL of an RPC node representing the blockchain.
Besides the `http` and `https` schemas the `ipc` schema can also be used:

```js
const bc = Blockchain.at("ipc:///home/john/geth/geth.ipc");
```

The blockchain object provides several query functions:

```js
const latestBlockNumber = await bc.blockNumber();
const firstBlock = await bc.block(1);
const someBalance = await bc.balanceOf(
	"0x5e94baef74b60e98116b971e9240d914f4059e27"
);
```

## Obtaining user objects

User objects represent accounts in the blockchain.
Getting a user is needed to send ether and call contracts (because any transaction assumes a sender account).

User accounts are obtained with the `user` function of the blockchain object:

```js
const alice = await bc.user();
```

If the blockchain is connected via IPC, then the user embedded in the local blockchain client will be assumed.
The local user is typically an unlocked account that can send signed transactions.

If the interface is a remote RPC (JSON over HTTP), then depending on the options the object can or can not be used to send transactions.
If a BIP44 mnemonic is provided, then the user will derive the private key and will be able to send transactions:

```js
const { Blockchain } = require("ethanol");
const bc = Blockchain.at("http://localhost:8545");

const bob = await bc.user({
	mnemonic: "eeny meeny miny moe catch a tiger by the toe"
});
```

If instead of mnemonic an address is given, the user will be able only to read the blockchain:

```js
const bob = await bc.user({ address: "0x..." });
```

The user objects can report its address and balance, and can be used to transfer Ether (in Wei units):

```js
const { Blockchain } = require("ethanol");
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

## Transactions

Transaction objects are returned for plain ether transfers, and also for contract calls and deployments.

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

This additional step has to be explicit to allow an application choose whether to wait or not for the actual result.

## Calling a contract

In order to work with a contract one needs to know its ABI (which is typically saved as JSON) and its address.
The contract function on a blockchain object returns a "deployed contract" object.

```js
const abi = JSON.parse(fs.readFileSync("contract.abi"));
const address = "0x1234...";

const contract = bc.contract(abi, address);
```

A user object is also needed to call a contract.
The contract can be passed to the `read` and `call` functions of a user to statically read the contract's variables, make dry function runs or make actual calls:

```js
const val = await alice.read(contract, "variableName");
const result = await alice.read(contract, "functionName", ["arg1", "arg2"]);
const transaction = await alice.call(contract, "functionName");
```

The result of the `read` promise is just the value being read.
The result of the `call` promise is a contract call transaction which, as all transactions, has the `success` function,
but also can return the contract's event logs for that particular call:

```js
const transaction = await alice.call(contract, "funcName");
const logs = await transaction.logs();
```

Obtaining logs assumes waiting for the transaction to be mined, so it's not necessary to await for transaction.success in this case.

A transaction can also be obtained from a contract using the transaction's hash value.

```js
const transaction = await contract.transaction("0x1234abcd...");
```

The contract is necessary because it provides context (like an ABI definition) to the transaction so that the logs function will work.
The `transaction` function will also verify that the transaction exists and belongs to the same contract.

## Deploying contracts

A contract image is a combination of `abi` and `bin` properties which have the corresponding outputs of a Solidity compiler.
It will usually be obtained from files:

```js
const abi = fs.readFileSync("hello-world.abi");
const bin = fs.readFileSync("hello-world.bin");
const image = { abi, bin };
```

Given an existing contract image, it can be deployed from a user's account:

```js
const transaction = await user.deploy(image, [arg1, arg2]);
const contract = await transaction.contract();
```

The `deploy` function accepts a list of arguments which will be passed to the contract's constructor.
The returned promise will turn into a `DeployedContract` instance which can be used as usual.

## Building contracts

A contract can be compiled using the Compiler object:

```js
const { Compiler } = require("ethanol");
const com = new Compiler();
const image = await com.compile("hello-world.sol");
```

The `Compiler` object will call the host system's `solc` compiler through the command line.

The constructor takes a map of compiler options which exactly correspond to command line options of the `solc` compiler.
For example, to get binaries compatible with older versions of the blockchain:

```js
const com = new Compiler({ "evm-version": "spuriousDragon" });
const image = await com.compile("hello-world.sol");
```
