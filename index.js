import bitcoin from "bitcoinjs-lib";
import sqlite3 from "sqlite3";
import fs from "fs";

var wantPrefixes = JSON.parse(fs.readFileSync("addresses.json").toString());
var FORCE_EXIT = false;

let currAddr = "";

const findPrefix = (addr) =>
  wantPrefixes.find((want) => addr.slice(0, want.length).toLowerCase() == want);

const { Database } = sqlite3.verbose();

const db = new Database("database.db");
db.run("CREATE TABLE IF NOT EXISTS addresses (address TEXT, key TEXT)", main);

const main = () => {
  for (let i = 1; wantPrefixes.length != 0 && !FORCE_EXIT; i++) {
    const keyPair = bitcoin.ECPair.makeRandom();
    const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });

    const privateKey = keyPair.toWIF();

    const fAddr = findPrefix(address);
    if (fAddr) {
      var stmt = db.prepare(
        "INSERT INTO addresses (address, key) VALUES (?, ?)"
      );
      stmt.run(address, privateKey);
      stmt.finalize();

      wantPrefixes = wantPrefixes.filter((addr) => addr != fAddr);
      fs.writeFileSync("addresses.json", JSON.stringify(wantPrefixes));
    }
    currAddr = address;
    if (i % 10000 == 0) console.log(`count=${i}`);
  }

  finish();
};

const finish = () => {
  console.log(findPrefix(currAddr), FORCE_EXIT);
  db.close();
};

process.on("SIGINT", () => {
  console.log("catch SIGINT...");
  FORCE_EXIT = true;
});
