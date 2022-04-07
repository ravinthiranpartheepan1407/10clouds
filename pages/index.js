import { Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { CLOUDS_NFT_MINT_ABI, CLOUDS_NFT_MINT_ADDRESS } from "../constants";
import styles from "../styles/Home.module.css";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { BiWalletAlt } from "react-icons/bi";
import Swal from 'sweetalert2';
import withReactContent from "sweetalert2-react-content";


export default function Home() {
  const [userAddress, setUserAddress] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");
  const web3ModalRef = useRef();

  const route = useRouter();

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


  const publicMint = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const mintContract = new Contract(
        CLOUDS_NFT_MINT_ADDRESS,
        CLOUDS_NFT_MINT_ABI,
        signer
      );
      const tx = await mintContract.mint({
        value: utils.parseEther("0.01"),
      });
      transactionLoad();
      setLoading(true);
      await tx.wait();
      mintOpen();
      setLoading(false);
      window.location.href = "/Governance";
    } catch (err) {
      console.error(err);
    }
  };

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };



  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(
        CLOUDS_NFT_MINT_ADDRESS,
        CLOUDS_NFT_MINT_ABI,
        provider
      );
      const _owner = await nftContract.owner();
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const getTokenIdsMinted = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(
        CLOUDS_NFT_MINT_ADDRESS,
        CLOUDS_NFT_MINT_ABI,
        provider
      );
      const _tokenIds = await nftContract.tokenIds();
      setTokenIdsMinted(_tokenIds.toString());
    } catch (err) {
      console.error(err);
    }
  };

  const getProviderOrSigner = async(needSigner = false) =>{
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    const signer = web3Provider.getSigner();
    const addr = await signer.getAddress();
    setUserAddress(addr.toString());

    const {chainId} = await web3Provider.getNetwork();
    if(chainId !== 4){
      window.alert("Change Network To Rinkeby Test Network");
      throw new Error("Change Network to Rinkeby Test Network");
    }

    if(needSigner){
      const signer = web3Provider.getSigner();
      const addr = await signer.getAddress();
      setUserAddress(addr.toString());
      return signer;
    }
    return web3Provider;
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();


      getTokenIdsMinted();

      setInterval(async function () {
        await getTokenIdsMinted();
      }, 5 * 1000);
    }
  }, [walletConnected]);

  const renderButton = () => {
    if (!walletConnected) {
      return (
        <button
          onClick={connectWallet}
          className="bg-primary-500 flex items-center shadow-glow p-4"
        >
          <BiWalletAlt className="mr-2" />
          Connect your wallet
        </button>
      );
    }

    if (loading) {
      return (
        <button className="bg-primary-500 flex items-center shadow-glow py-4 px-10">
          Minting...
        </button>
      );
    }

    if (publicMint) {
      return (
        <>
          <button
            className="bg-primary-500 flex items-center shadow-glow py-4 px-10"
            onClick={publicMint}
          >
            <span className="Mint-NFT-">Mint your NFT</span>
          </button>
        </>
      );
    }
  };

  return (
    <div className=" h-screen w-screen antialiased">
      <Head>
        <title>10 clouds - NFT</title>
      </Head>
      <div className="flex h-screen flex-col md:flex-row">
        <div className="lg:mt-44 flex-1 md:p-20">
          <p className="text-7xl font-medium text-center text-primary-700 md:text-left">
            Ten clouds Governance Protocol
          </p>
          <br />
          <p className="text-xl font-medium text-center text-white text-primary-700 md:text-left">
            Wallet: {userAddress}
          </p>
          <p className="text-xl font-medium text-center text-white text-primary-700 md:text-left">
            Total Token Supply: { 100 - tokenIdsMinted } / 100
          </p>
          <p className="text-xl font-medium text-center text-white text-primary-700 md:text-left">
            Price: 0.01
          </p>
          <br />
          <p className="font-light text-center text-white text-primary-700 md:text-left">
            IPFS: https://gateway.pinata.cloud/ipfs/QmbSczPDoXKzed8XzbDFmugvHefubRHapECwsYVzng5AJm
          </p>
          <br />
          <div className="flex flex-col lg:grid grid-cols-2 gap-4 items-center md:items-start">
            <div className="pb-12">{renderButton()}</div>
            <div className="pb-12">
            <button
              className="bg-primary-500 flex items-center shadow-glow py-4 px-10"
              onClick={()=> router.push("https://faucets.chain.link/rinkeby")}
            >
              Eth Faucet
            </button>
            </div>
          </div>
          <p className="text font-medium text-center text-white text-primary-700 md:text-left">
            Users can mint only one 10 clouds NFT per one wallet address
          </p>
        </div>
        <div className="flex-1 shrink-0">
          <img
            src="./clouds.gif"
            alt="10 Clouds NFT"
            className="shrink-0 object-full w-full md:h-screen"
          />
        </div>
      </div>
    </div>
  );
}
