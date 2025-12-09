const EscrowContract = artifacts.require("EscrowContract");

module.exports = function (deployer) {
  deployer.deploy(EscrowContract, "0xCCE0d18fadeeC6Cdc256833865CCC349D0728C67", "0x3C8D92402c2ff41ED6c8D5382B4590f229aDAC0d");
}