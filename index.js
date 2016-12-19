/**
 * Created by ikonovalov on 14/12/16.
 */
'use strict';

const txMod = require('./lib/tx');

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
}

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