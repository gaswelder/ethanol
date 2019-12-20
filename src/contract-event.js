module.exports = class ContractEvent {
	constructor(web3Data) {
		/**
		 * @param {object} web3Data Data returned by web3.
		 */
		this.web3Data = web3Data;
		// event - String: The event name.
		// signature - String|Null: The event signature, null if it’s an anonymous event.
		// address - String: Address this event originated from.
		// returnValues - Object: The return values coming from the event, e.g. {myVar: 1, myVar2: '0x234...'}.
		// logIndex - Number: Integer of the event index position in the block.
		// transactionIndex - Number: Integer of the transaction’s index position the event was created in.
		// transactionHash 32 Bytes - String: Hash of the transaction this event was created in.
		// blockHash 32 Bytes - String: Hash of the block this event was created in. null when it’s still pending.
		// blockNumber - Number: The block number this log was created in. null when still pending.
		// raw.data - String: The data containing non-indexed log parameter.
		// raw.topics - Array: An array with max 4 32 Byte topics, topic 1-3 contains indexed parameters of the event.
	}

	/**
	 * Returns the event's name.
	 *
	 * @returns {string}
	 */
	name() {
		return this.web3Data.event;
	}

	/**
	 * Returns the event's key-value pairs.
	 *
	 * @returns {object}
	 */
	values() {
		return this.web3Data.returnValues;
	}
};
