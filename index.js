require('dotenv').config()
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv
import { RestClient, WebsocketClient } from 'ftx-api';
const {Keypair} = require("@solana/web3.js")

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

console.log(argv);
console.log(process.env.FTX_KEY);