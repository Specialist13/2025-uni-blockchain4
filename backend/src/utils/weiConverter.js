export class WeiConverter {
  static WEI_PER_ETHER = BigInt('1000000000000000000');

  static weiToEther(wei) {
    if (wei === null || wei === undefined) {
      return null;
    }

    const weiBigInt = typeof wei === 'bigint' ? wei : BigInt(wei.toString());
    const ether = Number(weiBigInt) / Number(this.WEI_PER_ETHER);
    return ether;
  }

  static etherToWei(ether) {
    if (ether === null || ether === undefined) {
      return null;
    }

    const etherNumber = typeof ether === 'string' ? parseFloat(ether) : ether;
    const wei = BigInt(Math.floor(etherNumber * Number(this.WEI_PER_ETHER)));
    return wei.toString();
  }

  static formatEther(ether, decimals = 6) {
    if (ether === null || ether === undefined) {
      return null;
    }
    return parseFloat(ether).toFixed(decimals);
  }
}
