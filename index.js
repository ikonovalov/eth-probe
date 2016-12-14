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
                let startBlock = options.startBlock || 0;
                let endBlock = options.endBlock || this._web3.eth.blockNumber;
                console.log(`Scan from ${startBlock} to ${endBlock}`)
            }
        }
    }

}

module.exports = EthProbe;