import bitcoin from "bitcoinjs-lib";
import sqlite3 from "sqlite3";
import fs from "fs";

const { Database } = sqlite3.verbose();

var wantPrefixes = JSON.parse(fs.readFileSync("addresses.json").toString());
var FORCE_EXIT = false;
var i = 0;

let currAddr = "";

const findPrefix = (addr) =>
  wantPrefixes.find((want) => addr.slice(0, want.length).toLowerCase() == want);

process.on("SIGINT", () => {
  console.log("catch SIGINT...");
  FORCE_EXIT = true;
});

const cycle = () => {
  const keyPair = bitcoin.ECPair.makeRandom();
  const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });

  const privateKey = keyPair.toWIF();

  const fAddr = findPrefix(address);
  if (fAddr) {
    console.log(`find: ${fAddr} (index=${i + 1})`);
    const db = new Database("database.db");
    db.prepare("INSERT INTO addresses (address, key) VALUES (?, ?)")
      .run(address, privateKey)
      .finalize()
      .close();

    wantPrefixes = wantPrefixes.filter((addr) => addr != fAddr);
    fs.writeFileSync("addresses.json", JSON.stringify(wantPrefixes));
  }
  currAddr = address;
  if (i % 10000 == 0) console.log(`count=${i}`);
  i++;
};

const main = async () => {
  if (wantPrefixes.length != 0 && !FORCE_EXIT) {
    for (let j = 0; j < 1000; j++) cycle();
  } else finish();

  setTimeout(main, 0);
};

const db = new Database("database.db");
db.run("CREATE TABLE IF NOT EXISTS addresses (address TEXT, key TEXT)", () => {
  db.close();
  main();
});

const finish = () => {
  console.log(FORCE_EXIT);
  process.exit(0);
};
