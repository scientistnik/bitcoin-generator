import bitcoin from "bitcoinjs-lib";
import sqlite3 from "sqlite3";
import fs from "fs";

const { Database } = sqlite3.verbose();

const db = new Database("database.db");
db.run("CREATE TABLE IF NOT EXISTS addresses (address TEXT, key TEXT)");

const wantPrefixes = JSON.parse(fs.readFileSync("addresses.json").toString());

let currAddr = "";

const findPrefix = (addr) =>
  wantPrefixes.find((want) => addr.slice(0, want.length).toLowerCase() == want);

for (let i = 1; !findPrefix(currAddr); i++) {
  const keyPair = bitcoin.ECPair.makeRandom();
  const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });

  const privateKey = keyPair.toWIF();

  if (findPrefix(address)) {
	  var stmt = db.prepare("INSERT INTO addresses (address, key) VALUES (?, ?)");
	  stmt.run(address, privateKey);
	  stmt.finalize();
  }
  currAddr = address;
  if (i%10000 == 0)
    console.log(`count=${i}`);
}

console.log(findPrefix(currAddr));
db.close();

