import { createContext, useEffect, useState, useContext } from "react";
import { AuthContext } from "./AuthContext";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null); // ✅ fixed
  const [unseenMessages, setUnseenMessages] = useState({});

  const { socket, axios } = useContext(AuthContext);

  // Function to get all users for sidebar
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success && Array.isArray(data.users)) {
  setUsers(data.users);
  setUnseenMessages(data.unseenMessages || {});
} else {
  setUsers([]);
}

    } catch (error) {
      toast.error(error.message);
    }
  };

  // Function to get messages for selected user
  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);
      if (data.success && Array.isArray(data.messages)) {
  setMessages(data.messages);
} else {
  setMessages([]); // ✅ always safe
}

    } catch (error) {
      toast.error(error.message);
    }
  };

  // Function to send message to selected user
  const sendMessage = async (messageData) => {
    try {
     if (!selectedUser?._id) {
  toast.error("No user selected");
  return;
}
const { data } = await axios.post(
  `/api/messages/send/${selectedUser._id}`,
  messageData
);

      if (data.success) {
        setMessages((prevMessages) => [...prevMessages, data.newMessage]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Function to subscribe to messages
  const subscribeToMessages = async () => {
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
     if (selectedUser?._id && newMessage.senderId === selectedUser._id) {

        newMessage.seen = true;
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        axios.put(`/api/messages/mark/${newMessage._id}`);
      } else {
        setUnseenMessages((prevUnseenMessages) => ({
          ...prevUnseenMessages,
          [newMessage.senderId]: prevUnseenMessages[newMessage.senderId]
            ? prevUnseenMessages[newMessage.senderId] + 1
            : 1,
        }));
      }
    });
  };

  // Function to unsubscribe from messages
  const unsubscribeFromMessages = () => {
    if (socket) socket.off("newMessage");
  };

  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [socket, selectedUser]);

  const value = {
    messages,
    users,
    selectedUser, // ✅ fixed
    getUsers,
    getMessages,
    sendMessage,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
  };

  return (
    <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
  );
};
