const HDWalletProvider = require("@truffle/hdwallet-provider");
const Web3 = require("web3");
require("dotenv").config();

const provider = new HDWalletProvider({
  mnemonic: { phrase: process.env.MNEMONIC },
  numberOfAddresses: 6,
  providerOrUrl: "https://avalanche-fuji-c-chain.publicnode.com",
});

const web3 = new Web3(provider);

(async () => {
  const accounts = await web3.eth.getAccounts();
  console.log(accounts);  // this prints all 6 addresses
})();
