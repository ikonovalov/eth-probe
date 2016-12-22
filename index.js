/**
 * Created by ikonovalov on 14/12/16.
 */
"use strict";

const Tx = require('ethereumjs-tx');
const Eu = require('ethereumjs-util');

const composeBlockScanOptions = (eth, options) => {
    let fromBlockNumber = options.fromBlock || 0;
    let toBlockNumber = (!options.toBlock || options.toBlock === 'latest') ? eth.blockNumber : options.toBlock;

    if (options.fromOffset && !options.fromBlock) {
        fromBlockNumber = toBlockNumber - options.fromOffset;
    }

    return {
        fromBlockNumber: fromBlockNumber,
        toBlockNumber: toBlockNumber
    }
};

const buildTx = (gethTx) => {
    let tx = new Tx(null);
    tx.nonce = Eu.intToHex(gethTx.nonce);
    tx.gasPrice = Eu.intToHex(gethTx.gasPrice);
    tx.gasLimit = Eu.intToHex(gethTx.gas);
    tx.to = gethTx.to;
    tx.value = Eu.intToHex(gethTx.value);
    tx.data = gethTx.input;
    tx.r = gethTx.r;
    tx.s = gethTx.s;
    tx.v = gethTx.v;
    return tx;
};

const flatten = list => list.reduce(
    (a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []
);

class EthProbe {

    constructor(web3) {
        this._web3 = web3;
    }

    get tx() {
        return {

            /**
             * Get original Web3 tx (REQUIRE Geth 1.5+)
             * @param txHash
             * @returns {*}
             */
            get: (txHash) => {
                return this._web3.eth.getTransaction(txHash)
            },

            /**
             * Get ethereumjs-Tx.
             * @param txHash
             */
            getX: (txHash) => {
                let gtx = this._web3.eth.getTransaction(txHash);
                let tx = buildTx(gtx);
                return tx;
            },

            /**
             * Search TXs using log filtration algorithm.
             * @param address
             * @param options
             * @returns {Promise}
             */
            toAddressFast: (address, options = {}) => {
                let eth = this._web3.eth;
                let composedOptions = composeBlockScanOptions(eth, options);

                let filter = eth.filter({
                    address: address,
                    fromBlock: composedOptions.fromBlockNumber,
                    toBlock: composedOptions.toBlockNumber
                });

                return new Promise((resolve, rejected) => {
                    filter.get((error, result) => {
                        if (!error) {
                            let txs = result.map(log => log.transactionHash);
                            resolve(txs);
                        } else {
                            rejected(error)
                        }
                    });
                });
            },

            /**
             * Search TXs using full block scan algorithm.
             * @param address
             * @param options
             * @returns {Promise}
             */
            toAddressFullScan: (address, options = {}) => {
                let eth = this._web3.eth;
                let composedOptions = composeBlockScanOptions(eth, options);
                let promise = new Promise((resolved, rejected) => {
                    try {
                        let txs = [];
                        for (let i = composedOptions.fromBlockNumber; i <= composedOptions.toBlockNumber; i++) {
                            let block = eth.getBlock(i, true);
                            if (block.transactions.length > 0) {
                                let blockFiltredTxHashes = block.transactions.filter(tx => tx.to == address).map(tx => tx.hash);
                                txs.push(blockFiltredTxHashes);
                            }
                        }
                        resolved(flatten(txs))
                    } catch (error) {
                        rejected(error)
                    }
                });
                return promise

            }
        }
    }

}

module.exports = EthProbe;