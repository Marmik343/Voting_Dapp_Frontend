import {useState , useEffect} from 'react';
import {ethers} from 'ethers';
import {contractAddress, contractAbi} from './Constant/constant';
import Login from './Components/Login';
import Connected from './Components/Connected';
import Finished from './Components/Finished';
import './App.css';

function App() {

  const [provider,setProvider] = useState(null);
  const [account , setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [votingStatus, setVotingStatus] = useState(true);
  const [remainingTime, setRemainingTime] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [number,setNumber] = useState('');
  const [canVote, setCanVote] = useState(true);

    useEffect( () => {
    // setVotingStatus(false);
    getCandidates();
    getRemainingTime();
    getCurrentStatus();
    if (window.ethereum){
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }
    return() => {
      if(window.ethereum){
        window.ethereum.removeListener('accountsChanged',handleAccountsChanged);
      }else{
        setIsConnected(false);
        setAccount(null);
      }
    }
  });

  function handleAccountsChanged(accounts){
    if(accounts.length > 0 && account !== accounts[0]){
      setAccount(accounts[0]);
      CanVote();
    }else{
      setIsConnected(false);
      setAccount(null);
    }
  }

  async function vote(){
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
    const tnx = await contractInstance.vote(number);
    await tnx.wait();
    CanVote();
  }

  async function CanVote(){
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
    const voteStatus = await contractInstance.voters(await signer.getAddress());
    setCanVote(voteStatus);

  }

  async function getCandidates() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
    const candidatesList = await contractInstance.getAllVotesOfCandiates();
    const formattedCandidates = candidatesList.map((candidate, index) => {
      return {
        index: index,
        name: candidate.name,
        voteCount: candidate.voteCount.toNumber()
      }
    });
    setCandidates(formattedCandidates);
}


async function getCurrentStatus() {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();
  const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
    const status = await contractInstance.getVotingStatus();
    console.log(status);
    setVotingStatus(status);
}

async function getRemainingTime() {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();
  const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
    const time = await contractInstance.getRemainingTime();
    setRemainingTime(parseInt(time, 16));
}

  async function connectMetamask(){
    if(window.ethereum){
      try{
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address); 
        console.log("Metamask Connected: " ,address);
        setIsConnected(true);
        CanVote();
      }catch(err){
        console.log(err);
      }
    }else{
      console.error("Metamask not detected in the browser");
    }
  }

  async function handleNumberChange(e){
    setNumber(e.target.value);
  }


  return (
    <div className="App">
      {
        votingStatus ? 
                      (isConnected ? 
                                    (<Connected account = {account}
                                                candidates = {candidates}
                                                remainingTime ={remainingTime}
                                                number = {number} 
                                                handleNumberChange = {handleNumberChange}
                                                voteFunction = {vote}
                                                showButton = {canVote}/>) 
                                              
                                  : (<Login connectWallet={connectMetamask}/>) ) 
                                  
                      : (<Finished/>)
      }
    </div>
  );
}

export default App;
