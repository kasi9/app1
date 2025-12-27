import axios from "axios";
import { useContext, useEffect } from "react";
import { toast } from "react-toastify";
import { AppContent } from "../context/AppContext";
import { useLoading } from "../context/useLoading";

const Home = () => {
  
    const { baseURL } = useContext(AppContent)!;
    const { showLoading, hideLoading } = useLoading();


useEffect(() => {
  showLoading();

  const t = setTimeout(() => {
    console.log("test loading");
    hideLoading();
  }, 10000);

  return () => clearTimeout(t);
}, []);


  const insertDefaultData = async () => {
    const defaultData = 
[
  { "code": "org", "name": "Organizations", "actions": ["Read","Create", "Update", "Delete", "Active"]},
	{ "code": "role", "name": "Roles", "actions": ["Read","Create", "Update", "Delete", "Active"]},
	{ "code": "person", "name": "Person", "actions": ["Read","Create", "Update", "Delete", "Active"]},

	{ "code": "asset", "name": "Asset", "actions": ["Read","Create", "Update", "Delete", "Active", "BulkCreate"]},
	{ "code": "playList", "name": "Play List", "actions": ["Read","Create", "Update", "Delete", "Active"]},

  { "code": "video", "name": "Video", "actions": ["Read","Create", "Update", "Delete", "Active"]},
  { "code": "audio", "name": "Audio", "actions": ["Read","Create", "Update", "Delete", "Active"]},
	{ "code": "image", "name": "Image", "actions": ["Read","Create", "Update", "Delete", "Active"]},
	{ "code": "link", "name": "Link", "actions": ["Read","Create", "Update", "Delete", "Active"]},
	{ "code": "place", "name": "Place", "actions": ["Read","Create", "Update", "Delete", "Active"]},
] ;


    await axios.post(`${baseURL}/privilege/bulkinsert`, defaultData);
    toast.success('Default data created');
  }
  
    return (
        <div style={{ width:"100%", height:"80vh", textAlign:"center", backgroundColor:"lightgray",}}>
            <div><h1>Home page</h1></div>
            <div><button onClick={ insertDefaultData } className="btn">Create Default Data</button></div>
        </div>
    );
}

export default Home;
