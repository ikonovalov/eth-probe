/**
 * Created by ikonovalov on 14/12/16.
 */
'use strict';

const txMod = require('./lib/tx');

class EthProbe {

    constructor(web3) {
        this._web3 = web3;
    }

    get tx() {
        return {
            fromAddress: (address, options = {}) => {
                const eth = this._web3.eth;
                let startBlockNumber = options.startBlock || 0;
                let endBlockNumber = options.endBlock || eth.blockNumber;

                console.log(`Scan from ${startBlockNumber} to ${endBlockNumber}`);
                for (let i = startBlockNumber; i <= endBlockNumber; i++) {
                    let block = eth.getBlock(i, true);
                    if (block.transactions.length) {
                        console.log(block.number + ' -> ' + block.transactions.length)
                    }
                }
            }
        }
    }

}

module.exports = EthProbe;