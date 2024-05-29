import * as borsh from 'borsh';
import * as web3 from '@solana/web3.js';

class GreetingAccount {
  counter = 0;
  constructor(fields: {counter: number} | undefined = undefined) {
    if (fields) {
      this.counter = fields.counter;
    }
  }
}

const GreetingSchema = new Map([
  [GreetingAccount, {kind: 'struct', fields: [['counter', 'u32']]}]
]);



/* const GREETING_SIZE = borsh.serialize (
  GreetingSchema,
  new GreetingAccount(),
).length; 
 */
//console.log(GREETING_SIZE);

const GREETING_SIZE = 11 * 1024 * 1024;


let payer: web3.Keypair;
let programId: web3.PublicKey;
let greetedPubkey: web3.PublicKey;

async function establishPayer(): Promise<void> {

  payer = pg.wallet.keypair;
  let lamports = await pg.connection.getBalance(pg.wallet.publicKey);

  console.log(
    'Using account',
    payer.publicKey.toBase58(),
    'containing',
    lamports / web3.LAMPORTS_PER_SOL,
    'SOL to pay for fees'
  );
}



async function checkProgram(): Promise<void> {

  
  programId = new web3.PublicKey("AAZxXx3aAeZ3baYHj45B6Mak8Y7RJe46nvEPG4rzUTHK");
  console.log(Object.prototype.toString.call(pg.wallet.publicKey));
  console.log(`Using program ${programId}`);

  const GREETING_SEED = 'hello';
  greetedPubkey = await web3.PublicKey.createWithSeed(
    payer.publicKey,
    GREETING_SEED,
    programId
  );
  console.log("newly created key", greetedPubkey.toBase58())
  const greetedAccount = await pg.connection.getAccountInfo(greetedPubkey);

  const lamports = await pg.connection.getMinimumBalanceForRentExemption(
    GREETING_SIZE,
  );
  const transaction = new web3.Transaction().add(
    web3.SystemProgram.createAccountWithSeed({
      fromPubkey: payer.publicKey,
      basePubkey: payer.publicKey,
      seed: GREETING_SEED,
      newAccountPubkey: greetedPubkey,
      lamports,
      space: GREETING_SIZE,
      programId
    }),
  );
  console.log("111111111")
  console.log(transaction)
  console.log("22222222")

  await web3.sendAndConfirmTransaction(
    pg.connection,
    transaction,
    [payer]
  );

  }




async function sayHello(): Promise<void> {
  try {
    console.log('Saying hello to', greetedPubkey.toBase58());
    const instruction = new web3.TransactionInstruction({
      keys: [{pubkey: greetedPubkey, isSigner: false, isWritable:true}],
      programId,
      data: Buffer.alloc(0),
    });
    const transaction = new web3.Transaction();
    transaction.add(instruction);


    //console.log(transaction);

    await web3.sendAndConfirmTransaction(
      pg.connection,
      transaction,
      [payer],
    );

    //console.log('Are we okay');
  } catch (error) {
    console.error('Error occurred:', error);
    if (error.logs) {
    console.log('Transaction logs:', error.logs);
  }
  }
}


async function reportGreetings(): Promise<void> {

  const accountInfo = await pg.connection.getAccountInfo(greetedPubkey);

  if (accountInfo === null) {
    throw 'Error: cannot find the greeted account';
  }

  const greeting = borsh.deserialize(
    GreetingSchema,
    GreetingAccount,
    accountInfo.data
  )

  console.log(
    greetedPubkey.toBase58(),
    'has been greeted',
    greeting.counter,
    'time(s)',
  ); 

  

}

async function main(){
  await establishPayer();
  await checkProgram();
  await sayHello();
  await reportGreetings();
  console.log('Success');
}

main().then(
  () => {},
  err => {
    console.error(err);
  }
)

