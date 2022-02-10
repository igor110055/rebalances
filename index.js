require('dotenv').config()
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const argv = yargs(hideBin(process.argv)).argv;

import { RestClient, WebsocketClient } from 'ftx-api';
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const WebSocket = require('ws');
const { Keypair, Connection, PublicKey, Account } = require('@solana/web3.js');
const { Market } = require('@project-serum/serum');
const bs58 = require('bs58');
const path = require('path');
const fs = require('fs');

const ftxWithdrawal = async (amount, coin) => {
    const client = new RestClient(process.env.FTX_KEY, process.env.FTX_SECRET);

    const res = await client.requestWithdrawal(
        coin,
        amount,
        process.env.SOLANA_PUBLIC_KEY,
    );

    console.log('FTX -> SERUM', { amount, coin });
    console.log('res', res);
}

// https://medium.com/@asmiller1989/solana-transactions-in-depth-1f7f7fe06ac2
// https://github.com/solana-labs/solana/blob/master/web3.js/examples/send_sol.js
// https://docs.solana.com/developing/clients/javascript-api#creating-and-sending-transactions

// KeyPair
// https://docs.solana.com/developing/clients/javascript-reference

// tokens
// https://github.com/solana-labs/solana-program-library/blob/master/token/js/examples/create_mint_and_transfer_tokens.js
const serumWithdrawal = async (amount, coin) => {
    if (!await settledTokens(process.env.SERUM_MARKET_ADDRESS, process.env.SERUM_PROGRAM_ID)) {
        return;
    }

    serumTransaction(0.001, 'USDT');
}

const serumTransaction = async (amount, coin) => {
    const accountFrom = Keypair.fromSecretKey(process.env.SOLANA_SECRET_KEY);

    // todo...

    // Connect to cluster
    const connection = new web3.Connection(
        web3.clusterApiUrl(process.env.SOLANA_RPC_URL),
        'confirmed',
    );

    // Generate a new random public key
    var from = web3.Keypair.generate();
    var airdropSignature = await connection.requestAirdrop(
        from.publicKey,
        web3.LAMPORTS_PER_SOL,
    );
    await connection.confirmTransaction(airdropSignature);

    // Generate a new random public key
    var to = web3.Keypair.generate();

    // Add transfer instruction to transaction
    var transaction = new web3.Transaction().add(
        web3.SystemProgram.transfer({
            fromPubkey: from.publicKey,
            toPubkey: to.publicKey,
            lamports: web3.LAMPORTS_PER_SOL / 100,
        }),
    );

    // Sign transaction, broadcast, and confirm
    var signature = await web3.sendAndConfirmTransaction(
        connection,
        transaction,
        [from],
    );
    console.log('SIGNATURE', signature);
}

// https://github.com/project-serum/serum-ts/tree/master/packages/serum
const settledTokens = async (marketAddr, programId) => {
    let connection = new Connection(process.env.SOLANA_RPC_URL);
    let privateKey = process.env.SOLANA_SECRET_KEY; // .toString();
    privateKey = bs58.decode(privateKey)
    const owner = new Account(privateKey)
    let marketAddress = new PublicKey(marketAddr)
    let programAddress = new PublicKey(programId)
    let market = await Market.load(connection, marketAddress, {}, programAddress)

    let openOrders = await market.findOpenOrdersAccountsForOwner(connection, owner.publicKey)
    /*
    кошелек для отправки SOL - надо указывать owner.publicKey
    кошелек для оправки USDT - B9x9ZwHCruH6xZNEfuwgXohcVpCsz8E24ixCVQAUU5MJ
    */
    for (let i in openOrders) {
        let openOrder = openOrders[i]

        if (openOrder.baseTokenFree > 0 || openOrder.quoteTokenFree > 0) {

            let baseTokenAccount = new PublicKey(owner.publicKey)
            let quoteTokenAccount = new PublicKey('B9x9ZwHCruH6xZNEfuwgXohcVpCsz8E24ixCVQAUU5MJ')

            try {
                await market.settleFunds(
                    connection,
                    owner,
                    openOrder,
                    baseTokenAccount,
                    quoteTokenAccount,
                ).then(a => console.log(a))
                return true
            } catch (e) {
                return false
            }
        }
    }
}

console.log(argv);
console.log(process.env.FTX_KEY);