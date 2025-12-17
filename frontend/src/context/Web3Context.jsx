import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [network, setNetwork] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkConnection();
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connectWallet();
        }
      } catch (err) {
        console.error('Error checking connection:', err);
      }
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setAccount(null);
      setSigner(null);
    } else {
      setAccount(accounts[0]);
      if (provider) {
        const newSigner = provider.getSigner();
        setSigner(newSigner);
      }
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return { success: false, error: 'MetaMask not installed' };
    }

    try {
      setIsConnecting(true);
      setError(null);

      const ethereumProvider = new ethers.BrowserProvider(window.ethereum);
      await ethereumProvider.send('eth_requestAccounts', []);
      
      const network = await ethereumProvider.getNetwork();
      const signer = await ethereumProvider.getSigner();
      const address = await signer.getAddress();

      setProvider(ethereumProvider);
      setSigner(signer);
      setAccount(address);
      setNetwork(network);

      return { success: true, address };
    } catch (err) {
      const errorMessage = err.message || 'Failed to connect wallet';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setNetwork(null);
    setError(null);
  };

  const signTransaction = async (transaction) => {
    if (!signer) {
      throw new Error('Wallet not connected');
    }
    return await signer.sendTransaction(transaction);
  };

  const waitForTransaction = async (txHash) => {
    if (!provider) {
      throw new Error('Provider not available');
    }
    return await provider.waitForTransaction(txHash);
  };

  const value = {
    provider,
    signer,
    account,
    network,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    signTransaction,
    waitForTransaction,
    isConnected: !!account,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}
