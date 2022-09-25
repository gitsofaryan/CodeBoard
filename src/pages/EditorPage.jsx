import React, { useEffect, useRef, useState } from 'react'
import ACTIONS from '../Action';
import Client from '../components/Client';
import Editor from '../components/Editor';
import Doubt from '../components/Doubt';
import { initSocket } from '../Socket';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast';
import logo from "../logo.webp"
import DoubtSection from '../components/DoubtSection';
import bglogo from "../images/bglogo.png"
function EditorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChatShown, setChatShown] = useState(false);
  const [doubt, setDoubt] = useState("");
  const [allDoubts, setAllDoubts] = useState({});
  const handleChat = (e) => {
    e.preventDefault();
    setChatShown(true);
  }
  const { id } = useParams();
  console.log(id)
  const socketRef = useRef(null);
  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on('connect_error', (err) => handleerror(err));
      socketRef.current.on('connect_failed', (err) => handleerror(err));
      function handleerror(err) {
        toast.error('Socket connection failed, try again!')
        navigate('/');
      }
      socketRef.current.emit(ACTIONS.JOIN, {
        id,
        username: location.state.username
      });

      // Listening for doubt event
      socketRef.current.on(ACTIONS.DOUBT, ({ doubts, username, socketId }) => {
        console.log(doubts);
        setAllDoubts(doubts);
        toast.success(`${username} asked a doubt!`)
      })
      // Listening for joined event
      socketRef.current.on(ACTIONS.JOINED, ({ clients, username, socketId }) => {
        setclients(clients);
        if (username !== location.state.username) {
          toast.success(`${username} joined the room.`)
        }
      })

      // Disconnecting the user listener
      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room.`);
        setclients((prev) => {
          return prev.filter((item) => {
            return item.socketId !== socketId;
          })
        })
      })
    };
    init();
    return () => {
      socketRef.current.disconnect();
      socketRef.current.off(ACTIONS.JOINED);
      socketRef.current.off(ACTIONS.DISCONNECTED);
    }
  }, [])
  const [clients, setclients] = useState([]);
  if (!location.state) {
    return <Navigate to="/" />
  }
  async function copyRoomId() {
    try {
      await window.navigator.clipboard.writeText(id);
      toast.success('Room id has been copied to clipboard!')
    } catch (err) {
      toast.error(err);
    }
  }
  async function askDoubt() {
    socketRef.current.emit(ACTIONS.DOUBT, {
      id,
      username: location.state.username,
      doubt
    })
    setDoubt("");
  }
  function leaveRoom() {
    navigate('/');
    toast.success('You leaved the Room');
  }
  return (
    <div className='mainWrap'>
      <div className="aside">
        <div className="asideInner">
          <div className="logo"><h2 className='logo_design'><img src={bglogo} alt="" style={{width:'220px'}} /></h2></div>
          <h3>Teacher</h3>
          <div className="clientsList">
            {
              clients.length !== 0 && <Client key={clients[0].socketId} username={clients[0].username} />
            }
          </div>
          <h3>Students</h3>
          <div className="clientsList">
            {
              clients.map((item, index) => ((index !== 0) && <Client key={item.socketId} username={item.username} />))
            }
          </div>
        </div>
        <button className='btn copyBtn' onClick={copyRoomId} >Copy ROOM ID</button>
        <button className='btn leaveBtn' onClick={leaveRoom} >Leave</button>
      </div>
      <div className="editorWrap">
        <Editor socketRef={socketRef} id={id} />
      </div>
      <button className='btn doubtBtn' onClick={handleChat}>Ask a doubt? </button>
      {isChatShown && <DoubtSection status={setChatShown} setDoubt={setDoubt} doubt={doubt} askDoubt={askDoubt} allDoubts={allDoubts} />}
    </div>
  )
}

export default EditorPage