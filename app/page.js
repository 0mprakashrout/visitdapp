"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Home() {
  const { address, isConnected } = useAccount();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState("0.0000");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const [txHistory, setTxHistory] = useState([]);
  const [usernameMap, setUsernameMap] = useState({});
  const [username, setUsername] = useState("");

  // Load local data
  useEffect(() => {
    const savedTx = localStorage.getItem("txHistory");
    const savedUsers = localStorage.getItem("usernameMap");

    if (savedTx) setTxHistory(JSON.parse(savedTx));
    if (savedUsers) setUsernameMap(JSON.parse(savedUsers));
  }, []);

  // ✅ FIXED: balance fetch after connect
  useEffect(() => {
    if (!address || !window.ethereum) return;

    const load = async () => {
      await getBalance();
    };

    load();

    const interval = setInterval(() => {
      getBalance();
    }, 5000);

    return () => clearInterval(interval);
  }, [address]);

  // Extra safety
  useEffect(() => {
    if (isConnected) {
      getBalance();
    }
  }, [isConnected]);

  // Helpers
  const isValidAddress = (addr) => {
    try {
      return ethers.isAddress(addr);
    } catch {
      return false;
    }
  };

  const resolveRecipient = (input) => {
    return usernameMap[input] || input;
  };

  // Save username
  const saveUsername = () => {
    if (!username) return;

    const updated = { ...usernameMap, [username]: address };
    setUsernameMap(updated);
    localStorage.setItem("usernameMap", JSON.stringify(updated));
    setUsername("");
  };

  // ✅ FIXED getBalance
  async function getBalance() {
    try {
      if (!window.ethereum || !address) return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const bal = await provider.getBalance(address);

      setBalance(parseFloat(ethers.formatEther(bal)).toFixed(4));
    } catch (err) {
      console.log("Balance error:", err);
    }
  }

  // Send transaction
  async function sendPayment() {
    try {
      if (!recipient || !amount) {
        setStatus("⚠️ Enter recipient & amount");
        return;
      }

      const toAddress = resolveRecipient(recipient);

      if (!isValidAddress(toAddress)) {
        setStatus("❌ Invalid address or username");
        return;
      }

      setLoading(true);
      setStatus("Sending...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tx = await signer.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(amount),
      });

      const newTx = {
        hash: tx.hash,
        to: toAddress,
        amount,
        time: new Date().toLocaleString(),
      };

      const updatedHistory = [newTx, ...txHistory];
      setTxHistory(updatedHistory);
      localStorage.setItem("txHistory", JSON.stringify(updatedHistory));

      await tx.wait();

      setStatus("✅ Transaction successful");
      setAmount("");
      getBalance();

    } catch (err) {
      console.log(err);
      setStatus(err.shortMessage || err.message || "❌ Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">

      {/* 🔝 Top-right wallet */}
      <div style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 10
      }}>
        <ConnectButton showBalance={false} />
      </div>

      {!isConnected ? (
        <div className="card" style={{
          width: 320,
          textAlign: "center"
        }}>
          <h2 style={{ marginBottom: 10 }}>Veero</h2>

          <p style={{
            opacity: 0.7,
            marginBottom: 10
          }}>
            Fast payments
          </p>

          <p style={{
            fontSize: 13,
            opacity: 0.6
          }}>
            Connect your wallet using the top-right button
          </p>
        </div>
      ) : (
        <div style={{ width: "100%", maxWidth: 900 }}>

          {/* Balance */}
          <div className="card">
            <p>Balance</p>
            <h2>{balance} ARC</h2>
          </div>

          {/* Username */}
          <div className="card" style={{ marginTop: 20 }}>
            <h3>Username</h3>
            <input
              className="input"
              placeholder="@username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button className="btn" onClick={saveUsername}>
              Save
            </button>
          </div>

          {/* Send */}
          <div className="card" style={{ marginTop: 20 }}>
            <h3>Send</h3>

            <input
              className="input"
              placeholder="Address or @username"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />

            <input
              className="input"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <button
              className="btn"
              onClick={sendPayment}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send"}
            </button>

            <p style={{ marginTop: 10 }}>{status}</p>
          </div>

          {/* Transactions */}
          <div className="card" style={{ marginTop: 20 }}>
            <h3>Transactions</h3>

            {txHistory.length === 0 && <p>No transactions yet</p>}

            {txHistory.map((tx, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <p>{tx.amount} ARC → {tx.to.slice(0, 10)}...</p>
                <p style={{ fontSize: 12 }}>{tx.time}</p>

                <a
                  href={`https://explorer.arc.network/tx/${tx.hash}`}
                  target="_blank"
                >
                  View TX
                </a>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}