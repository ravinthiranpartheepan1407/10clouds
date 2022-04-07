import { Contract, providers } from "ethers";
import { formatEther } from "ethers/lib/utils";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import {
  CLOUDS_PROTOCOL_ABI,
  CLOUDS_PROTOCOL_ADDRESS,
  CLOUDS_NFT_MINT_ABI,
  CLOUDS_NFT_MINT_ADDRESS,
} from "/constants";
import styles from "/styles/Home.module.css";
import Swal from 'sweetalert2';
import withReactContent from "sweetalert2-react-content";
import Link from "next/link";


export default function Home() {
  const [treasuryBalance, setTreasuryBalance] = useState("0");
  const [numProposals, setNumProposals] = useState("0");
  const [input, setInput] = useState("");
  const [submittedInput, setSubmittedInput] = useState("");
  const [proposals, setProposals] = useState([]);
  const [nftBalance, setNftBalance] = useState(0);
  const [cloudsNFTTokenID, setcloudsNFTTokenID] = useState("");
  const [selectedTab, setSelectedTab] = useState("");
  const [loading, setLoading] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const web3ModalRef = useRef();

  const MySwal = withReactContent(Swal);

  const governance = () => {
    MySwal.fire({
      title: 'Congratuations from 10 Clouds Governance',
      text: 'You have successfully created a proposal',
      background:'white',
      color: 'black',
      icon: 'success',
    });
  };

  const mintOpen = () => {
    MySwal.fire({
      title: 'Successfully minted Your NFT',
      text: 'You will redirected to the 10 Clouds Governance Protocol',
      background:'white',
      color: 'black',
      icon: 'success',
      timer: 2500
    });
  };

  const transactionLoad = () => {
    MySwal.fire({
      title: 'Please wait you transaction is being confirmed on chain',
      text: 'Please do not refresh or close the transaction',
      background:'white',
      color: 'black',
      icon: 'success',
      timer: 3000
    });
  };

  const governanceVoted = () => {
    MySwal.fire({
      title: 'Thank you for providing your vote on 10 clouds proposal',
      text: 'You have successfully voted on 10 clouds proposal',
      background:'white',
      color: 'black',
      icon: 'success',
      timer: 3000
    });
  };

  const governanceExecuted = () => {
    MySwal.fire({
      title: 'Thank you for Executed the 10 clouds proposal',
      text: 'You have successfully Executed 10 clouds proposal on chain',
      background:'white',
      color: 'black',
      icon: 'success',
      timer: 3000
    });
  };



  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.error(error);
    }
  };

  const getDAOTreasuryBalance = async () => {
    try {
      const provider = await getProviderOrSigner();
      const balance = await provider.getBalance(
        CLOUDS_PROTOCOL_ADDRESS
      );
      setTreasuryBalance(balance.toString());
    } catch (error) {
      console.error(error);
    }
  };

  const getNumProposalsInDAO = async () => {
    try {
      const provider = await getProviderOrSigner();
      const contract = getDaoContractInstance(provider);
      const daoNumProposals = await contract.numProposals();
      setNumProposals(daoNumProposals.toString());
    } catch (error) {
      console.error(error);
    }
  };

  const getUserNFTBalance = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = getCloudsNFTContract(signer);
      const balance = await nftContract.balanceOf(signer.getAddress());
      setNftBalance(parseInt(balance.toString()));
    } catch (error) {
      console.error(error);
    }
  };

  const createProposal = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const daoContract = getDaoContractInstance(signer);
      const txn = await daoContract.createProposal(cloudsNFTTokenID);
      transactionLoad();
      setLoading(true);
      await txn.wait();
      await getNumProposalsInDAO();
      governance();
      setLoading(false);
    } catch (error) {
      console.error(error);
      window.alert(error.data.message);
    }
  };


  const fetchProposalById = async (id) => {
    try {
      const provider = await getProviderOrSigner();
      const daoContract = getDaoContractInstance(provider);
      const proposal = await daoContract.proposals(id);
      const parsedProposal = {
        proposalId: id,
        nftTokenId: proposal.nftTokenId.toString(),
        deadline: new Date(parseInt(proposal.deadline.toString()) * 1000),
        approve: proposal.approve.toString(),
        deny: proposal.deny.toString(),
        executed: proposal.executed,
      };
      return parsedProposal;
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAllProposals = async () => {
    try {
      const proposals = [];
      for (let i = 0; i < numProposals; i++) {
        const proposal = await fetchProposalById(i);
        proposals.push(proposal);
      }
      setProposals(proposals);
      return proposals;
    } catch (error) {
      console.error(error);
    }
  };


  const voteOnProposal = async (proposalId, _vote) => {
    try {
      const signer = await getProviderOrSigner(true);
      const daoContract = getDaoContractInstance(signer);

      let vote = _vote === "YEP" ? 0 : 1;
      const txn = await daoContract.voteOnProposal(proposalId, vote);
      transactionLoad();
      setLoading(true);
      await txn.wait();
      setLoading(false);
      governanceVoted();
      await fetchAllProposals();
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
  };

  const executeProposal = async (proposalId) => {
    try {
      const signer = await getProviderOrSigner(true);
      const daoContract = getDaoContractInstance(signer);
      const txn = await daoContract.executeProposal(proposalId);
      transactionLoad();
      setLoading(true);
      await txn.wait();
      setLoading(false);
      governanceExecuted();
      await fetchAllProposals();
    } catch (error) {
      console.error(error);
      window.alert(error.data.message);
    }
  };

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Please switch to the Rinkeby network!");
      throw new Error("Please switch to the Rinkeby network");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };


  const getDaoContractInstance = (providerOrSigner) => {
    return new Contract(
      CLOUDS_PROTOCOL_ADDRESS,
      CLOUDS_PROTOCOL_ABI,
      providerOrSigner
    );
  };


  const getCloudsNFTContract = (providerOrSigner) => {
    return new Contract(
      CLOUDS_NFT_MINT_ADDRESS,
      CLOUDS_NFT_MINT_ABI,
      providerOrSigner
    );
  };


  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      connectWallet().then(() => {
        getDAOTreasuryBalance();
        getUserNFTBalance();
        getNumProposalsInDAO();
      });
    }
  }, [walletConnected]);

  useEffect(() => {
    if (selectedTab === "View Proposals") {
      fetchAllProposals();
    }
  }, [selectedTab]);

  function renderTabs() {
    if (selectedTab === "Create Proposal") {
      return renderCreateProposalTab();
    } else if (selectedTab === "View Proposals") {
      return renderViewProposalsTab();
    }
    return null;
  }

  function renderCreateProposalTab() {
    if (loading) {
      return (
        <div className="text-white text-center">
          Loading... Waiting for transaction...
        </div>
      );
    } else if (nftBalance === 0) {
      return (
        <div className="text-white text-center">
          You have not minted 10 Clouds NFT. <br />
          <b>So you cannot approve or deny the 10 Clouds proposals</b>
        </div>
      );
    } else {
      return (
        <div className="text-white text-xl">
          <label>10 Clouds NFT Token ID to Purchase: </label>
          <br />
          <br />
          <input
            className="bg-background border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="0"
            type="number"
            onChange={(e) => setcloudsNFTTokenID(e.target.value)}
          />
          <br />
          <form onSubmit={(e) => e.preventDefault()} className="Search__form">
          <input
            className="bg-background border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="Write your proposal"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <br />
          <div className="grid grid-cols-3 grid-gap-4">
            <button className="block w-full py-4 px-20 text-sm font-medium text-black rounded shadow bg-white focus:outline-none focus:ring" onClick={()=>setSubmittedInput(input)}>1. Set Proposal</button>
            &nbsp;
            <button className="block w-full py-4 px-24 text-sm font-medium text-black rounded shadow bg-white focus:outline-none focus:ring" onClick={createProposal}>
              2. Create
            </button>
          </div>
          </form>
          <br />

        </div>
      );
    }
  }


  function renderViewProposalsTab() {
    if (loading) {
      return (
        <div className="block w-full py-4 ml-8 px-4 text-sm font-medium text-white rounded shadow bg-gradient-to-r from-lime-200 via-lime-400 to-lime-500 sm:w-auto active:bg-lime-100 hover:bg-lime-300 focus:outline-none focus:ring">
          Loading... Waiting for transaction...
        </div>
      );
    } else if (proposals.length === 0) {
      return (
        <div className="text-white text-xl">No 10 Clouds proposals have been created</div>
      );
    } else {
      return (
        <div className="lg:grid grid-cols-2 grid-gap-4">
          {proposals.map((p, index) => (
            <div key={index} className="text-black text-center text-xl block p-6 max-w-sm bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
              <p>Proposal ID: {p.proposalId}</p>
              <p>Proposal Token: {p.nftTokenId}</p>
              <p>Proposal: {submittedInput}</p>
              <p>Deadline: {p.deadline.toLocaleString()}</p>
              <p>Approve: {p.approve}</p>
              <p>Deny: {p.deny}</p>
              <p>Executed: {p.executed.toString()}</p>
              {p.deadline.getTime() > Date.now() && !p.executed ? (
                <div className="grid grid-cols-1 grid-gap-4">
                  <button
                    className="block w-full py-4 lg:ml-8 px-4 text-sm font-medium text-white rounded shadow bg-black sm:w-auto focus:outline-none focus:ring"
                    onClick={() => voteOnProposal(p.proposalId, "YEP")}
                  >
                    Vote YEP
                  </button>
                  <br />
                  <button
                    className="block w-full py-4 lg:ml-8 px-4 text-sm font-medium text-white rounded shadow bg-black sm:w-auto focus:outline-none focus:ring"
                    onClick={() => voteOnProposal(p.proposalId, "NAH")}
                  >
                    Vote NAH
                  </button>
                </div>
              ) : p.deadline.getTime() < Date.now() && !p.executed ? (
                <div className={styles.flex}>
                  <button
                    className="block w-full py-4 ml-8 px-4 text-sm font-medium text-black rounded shadow bg-white sm:w-auto focus:outline-none focus:ring"
                    onClick={() => executeProposal(p.proposalId)}
                  >
                    Execute Proposal{" "}
                    {p.approve > p.deny ? "(YEP)" : "(NAH)"}
                  </button>
                </div>
              ) : (
                <div className="">Proposal Executed</div>
              )}
            </div>
          ))}
        </div>
      );
    }
  }

  return (
    <div className=" h-full w-screen antialiased">
    <Head>
      <title>10 Clouds</title>
      <meta name="description" content="10 Clouds Blockchain" />
    </Head>

      <div className="flex bg-background h-full justify-center items-center flex-col md:flex-row">
        <div className="p-10 flex-1 md:p-20">
        <h1 className="text-4xl text-white font-bold text-white text-center">10 Clouds Governance Protocol</h1>
          <br />
          <div className="grid grid-cols-3 grid-gap-8">
          <p className="block p-6 max-w-sm bg-white border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 text-center text-black text-xl font-light text-center md:text-left">10 Clouds NFT in Your Wallet: {nftBalance}</p>
          <p className="block p-6 max-w-sm bg-white border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 text-center text-black text-xl font-light text-center md:text-left">10 Clouds Treasury: {formatEther(treasuryBalance)} ETH (ERC-20)</p>
          <p className="block p-6 max-w-sm bg-white border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 text-center text-black text-xl font-light text-center md:text-left">Total Number of 10 Clouds Proposals: {numProposals}</p>
          </div>
          <br />
          <br />
          <div className="flex flex-col items-center grid grid-cols-3 grid-gap-8 md:items-start">
          <button
            className="block w-full py-4 px-4 text-sm font-medium text-black bg-white rounded shadow sm:w-auto active:bg-lime-100 hover:bg-lime-300 focus:outline-none focus:ring"
            onClick={() => setSelectedTab("Create Proposal")}
          >
            Create Proposal
          </button>
          &nbsp;
          <button
            className="block w-full py-4 px-4 text-sm font-medium text-black bg-white rounded shadow sm:w-auto active:bg-lime-100 hover:bg-lime-300 focus:outline-none focus:ring"
            onClick={() => setSelectedTab("View Proposals")}
          >
            View Proposals
          </button>

          </div>
          <br />
          <br />
          {renderTabs()}
          <div>
          <div className="pt-5 hidden sm:flex">
            <Link passHref href="https://testnets.opensea.io/collection/10-clouds-token-v2">
              <div className=" transition-all">
                <img
                  alt="Opensea logo"
                  className="w-20 h-20 rounded-2xl cursor-pointer"
                  src="./opensea.png"
                />
              </div>
            </Link>
          </div>
          <div className="pt-5 hidden sm:flex">
            <Link passHref href="https://rinkeby.rarible.com/collection/0xEAffA0e3C37eBcd6bF37e19797884a1643eDe2D4/items">
              <div className=" transition-all">
                <img
                  alt="Opensea logo"
                  className="w-20 h-20 cursor-pointer"
                  src="./rarible.png"
                />
              </div>
            </Link>
          </div>
          </div>
        </div>
        <div className="flex-1 shrink-0">
          <div className="flex-1 shrink-0 w-full object-cover md:h-screen">
            <img className="w-full h-screen" src="./clouds.gif" />
        </div>
        <div className="flex sm:hidden">
          <Link
            passHref
            href="https://testnets.opensea.io/collection/10-clouds-token-v2"
          >
            <div className="flex text-white items-center bg-opensea w-full">
              <img
                alt="Opensea logo"
                className="w-20 h-20 cursor-pointer"
                src="./opensea.png"
              />
              <p>See it in Opensea</p>
            </div>
          </Link>
        </div>
        <div className="flex sm:hidden">
          <Link
            passHref
            href="https://rinkeby.rarible.com/collection/0xEAffA0e3C37eBcd6bF37e19797884a1643eDe2D4/items"
          >
            <div className="flex text-white items-center bg-opensea w-full">
              <img
                alt="Opensea logo"
                className="w-20 h-20 cursor-pointer"
                src="./rarible.png"
              />
              <p>See it in Opensea</p>
            </div>
          </Link>
        </div>
      </div>
      </div>
    </div>

  );
}
